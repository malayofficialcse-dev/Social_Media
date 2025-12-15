import asyncHandler from "express-async-handler";
import Message from "../Models/Message.js";
import User from "../Models/User.js";
import Notification from "../Models/Notification.js";

import Group from "../Models/Group.js";
// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, groupId, content, isForwarded } = req.body;
  
  let image = null;
  let audio = null;

  if (req.files) {
    if (req.files.image) {
      image = req.files.image[0].path;
    }
    if (req.files.audio) {
      audio = req.files.audio[0].path;
      console.log("Audio uploaded:", audio);
    }
  } else if (req.file) {
    // Fallback for single file upload (backwards compatibility)
    image = req.file.path;
  }

  console.log("Send Message Request:", { content, image: !!image, audio: !!audio, receiverId, groupId });

  if ((!receiverId && !groupId) || (!content && !image && !audio)) {
    res.status(400);
    throw new Error("Invalid data passed into request");
  }

  var newMessage = {
    sender: req.user._id,
    content: content || "",
    image: image,
    audio: audio,
    isForwarded: isForwarded === 'true' || isForwarded === true, // handle string/bool
    status: 'sent',
  };

  if (receiverId) {
    newMessage.receiver = receiverId;
  }
  if (groupId) {
    newMessage.group = groupId;
  }

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "username profileImage");
    if (receiverId) message = await message.populate("receiver", "username profileImage");
    if (groupId) message = await message.populate("group");

    // Don't create notification here - let Socket.io handle it based on user's active chat status

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Fetch all messages between two users OR in a group
// @route   GET /api/messages/:id (id can be userId or groupId)
// @access  Private
export const allMessages = asyncHandler(async (req, res) => {
  try {
    const id = req.params.userId;
    
    // Check if it's a group
    // Optimization: Check formatting or try finding group first
    // Since IDs look same, we try to find group first if logic permits, or we check if user exists.
    // Let's try finding group first as it's a specific feature addition
    const group = await Group.findById(id);

    let messages;
    if (group) {
         // It is a group
         messages = await Message.find({ group: id })
            .populate("sender", "username profileImage")
            .populate("group")
            .sort({ createdAt: -1 });
    } else {
        // Assume it is a user
        messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: id },
                { sender: id, receiver: req.user._id },
            ],
            group: { $exists: false } // ensure we don't fetch group messages if by chance IDs conflict/mix (unlikely but safe) or if logic overlaps
        })
        .populate("sender", "username profileImage")
        .populate("receiver", "username profileImage")
        .sort({ createdAt: -1 });
    }

    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Get chat list (users + groups)
// @route   GET /api/messages/chats
// @access  Private
export const getChatList = asyncHandler(async (req, res) => {
  // Get followers and following
  const user = await User.findById(req.user._id).populate("followers following", "username profileImage email");
  
  // Combine unique users
  const chatUsersMap = new Map();
  
  user.followers.forEach(u => chatUsersMap.set(u._id.toString(), u));
  user.following.forEach(u => chatUsersMap.set(u._id.toString(), u));

  const chatUsers = Array.from(chatUsersMap.values());

  // Get User Chats with last message
  const enrichedChats = await Promise.all(
    chatUsers.map(async (chatUser) => {
      // Get unread messages count from this user
      const unreadCount = await Message.countDocuments({
        sender: chatUser._id,
        receiver: req.user._id,
        status: { $ne: 'read' }
      });

      // Get last message between these users
      const lastMessage = await Message.findOne({
        $or: [
          { sender: req.user._id, receiver: chatUser._id },
          { sender: chatUser._id, receiver: req.user._id }
        ],
        group: { $exists: false }
      }).sort({ createdAt: -1 });

      return {
        ...chatUser.toObject(),
        unreadCount,
        isGroup: false,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.sender.toString()
        } : null
      };
    })
  );

  // Get Groups
  const groups = await Group.find({ members: req.user._id });
  
  const enrichedGroups = await Promise.all(
      groups.map(async (group) => {
          // Unread count for group (simpler version: count all messages since user's last read? Too complex for now, assume 0 or implement 'readBy' in group msgs)
          // For now, let's just get last message
          const lastMessage = await Message.findOne({ group: group._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'username');

          return {
              _id: group._id,
              username: group.name, // Map name to username for frontend compatibility
              profileImage: group.profileImage,
              isGroup: true,
              members: group.members,
              admins: group.admins,
              unreadCount: 0, // Pending implementation
              lastMessage: lastMessage ? {
                  content: lastMessage.content,
                  createdAt: lastMessage.createdAt,
                  senderId: lastMessage.sender._id.toString(),
                  senderName: lastMessage.sender.username
              } : null
          };
      })
  );

  // Combine and Sort
  const allChats = [...enrichedGroups, ...enrichedChats];

  allChats.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
    const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
    return bTime - aTime;
  });

  res.json(allChats);
});

// @desc    Mark messages as read
// @route   PUT /api/messages/:userId/mark-read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  try {
    await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user._id,
        status: { $ne: 'read' }
      },
      { status: 'read' }
    );

    // Emit socket event to the sender that their messages were read
    // req.params.userId is the sender of the messages
    req.io.to(req.params.userId).emit('message read', {
      readerId: req.user._id,
      senderId: req.params.userId
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Mark messages as delivered
// @route   PUT /api/messages/:userId/mark-delivered
// @access  Private
export const markAsDelivered = asyncHandler(async (req, res) => {
  try {
    await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user._id,
        status: 'sent'
      },
      { status: 'delivered' }
    );

    // Emit socket event to the sender that their messages were delivered
    req.io.to(req.params.userId).emit('message delivered', {
      receiverId: req.user._id,
      senderId: req.params.userId
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    React to a message
// @route   PUT /api/messages/:messageId/react
// @access  Private
export const reactToMessage = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Check if user already reacted
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReactionIndex > -1) {
      // If same emoji, remove reaction (toggle)
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Update emoji
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        emoji: emoji
      });
    }

    await message.save();

    // Populate user info for socket event
    let fullMessage = await Message.findById(messageId)
      .populate("sender", "username profileImage")
      .populate("reactions.user", "username profileImage");
      
    if (fullMessage.receiver) {
        fullMessage = await fullMessage.populate("receiver", "username profileImage");
    }
    if (fullMessage.group) {
        fullMessage = await fullMessage.populate("group");
    }

    // Emit reaction update to chat participants
    if (fullMessage.group) {
        // Broadcast to group room
        req.io.to(fullMessage.group._id.toString()).emit('message reaction', fullMessage);
    } else if (fullMessage.receiver) {
        // Direct message
        req.io.to(fullMessage.sender._id.toString()).emit('message reaction', fullMessage);
        req.io.to(fullMessage.receiver._id.toString()).emit('message reaction', fullMessage);
    }

    res.json(fullMessage);
  } catch (error) {
    console.error("Reaction Error:", error);
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Delete message (for me or everyone)
// @route   PUT /api/messages/:messageId/delete
// @access  Private
export const deleteMessage = asyncHandler(async (req, res) => {
  const { type } = req.body; // 'me' or 'everyone'
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    if (type === 'everyone') {
      // Only sender can delete for everyone
      if (message.sender.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error("You can only delete your own messages for everyone");
      }
      
      message.deletedForEveryone = true;
      message.content = "This message was deleted";
      message.image = "";
      message.audio = "";
      
      await message.save();
      
      // Notify via socket
      // Emit to sender and receiver
      const updateData = {
        messageId: message._id,
        deletedForEveryone: true,
        content: message.content
      };
      
      req.io.to(message.sender.toString()).emit('message deleted', updateData);
      
      // Emit to receiver or group
      if (message.group) {
          req.io.to(message.group.toString()).emit('message deleted', updateData);
      } else if (message.receiver) {
          req.io.to(message.receiver.toString()).emit('message deleted', updateData);
      }

    } else if (type === 'me') {
      // Add user to deletedBy array if not already there
      if (!message.deletedBy.includes(req.user._id)) {
        message.deletedBy.push(req.user._id);
        await message.save();
      }
    } else {
      res.status(400);
      throw new Error("Invalid delete type");
    }

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
