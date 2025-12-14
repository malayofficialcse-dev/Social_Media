import asyncHandler from "express-async-handler";
import Message from "../Models/Message.js";
import User from "../Models/User.js";
import Notification from "../Models/Notification.js";

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  
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

  console.log("Send Message Request:", { content, image: !!image, audio: !!audio, receiverId });

  if (!receiverId || (!content && !image && !audio)) {
    res.status(400);
    throw new Error("Invalid data passed into request");
  }

  var newMessage = {
    sender: req.user._id,
    receiver: receiverId,
    content: content || "",
    image: image,
    audio: audio,
    status: 'sent',
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "username profileImage");
    message = await message.populate("receiver", "username profileImage");

    // Don't create notification here - let Socket.io handle it based on user's active chat status

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Fetch all messages between two users
// @route   GET /api/messages/:userId
// @access  Private
export const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .populate("sender", "username profileImage")
      .populate("receiver", "username profileImage")
      .sort({ createdAt: -1 }); // Reverse order as requested

    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Get chat list (users who have chatted with current user or are followed/following)
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

  // Get messages to calculate unread count and last message
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
        ]
      }).sort({ createdAt: -1 });

      return {
        ...chatUser.toObject(),
        unreadCount,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.sender.toString()
        } : null
      };
    })
  );

  // Sort by most recent message
  enrichedChats.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
    const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
    return bTime - aTime;
  });

  res.json(enrichedChats);
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
    const fullMessage = await Message.findById(messageId)
      .populate("sender", "username profileImage")
      .populate("receiver", "username profileImage")
      .populate("reactions.user", "username profileImage");

    // Emit reaction update to both users in the chat
    req.io.to(fullMessage.sender._id.toString()).emit('message reaction', fullMessage);
    req.io.to(fullMessage.receiver._id.toString()).emit('message reaction', fullMessage);

    res.json(fullMessage);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
