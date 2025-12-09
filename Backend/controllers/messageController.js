import asyncHandler from "express-async-handler";
import Message from "../Models/Message.js";
import User from "../Models/User.js";
import Notification from "../Models/Notification.js";

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  const image = req.file ? req.file.path : null;

  if (!receiverId || (!content && !image)) {
    res.status(400);
    throw new Error("Invalid data passed into request");
  }

  var newMessage = {
    sender: req.user._id,
    receiver: receiverId,
    content: content || "",
    image: image,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "username profileImage");
    message = await message.populate("receiver", "username profileImage");

    // Create notification for receiver
    await Notification.create({
      recipient: receiverId,
      sender: req.user._id,
      type: 'message',
      message: content ? content.substring(0, 50) : 'Sent you an image',
    });

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
        isRead: false
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
        isRead: false
      },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
