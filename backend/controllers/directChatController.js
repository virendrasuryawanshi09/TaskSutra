const DirectChat = require("../models/DirectChat");
const DirectMessage = require("../models/DirectMessage");

// @desc    Get all direct chats for the current user
// @route   GET /api/direct-chats
// @access  Private
exports.getDirectChats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const chats = await DirectChat.find({ participants: userId })
      .populate("participants", "name profilePicture email role")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching direct chats:", error);
    res.status(500).json({ message: "Server error fetching direct chats" });
  }
};

// @desc    Get messages between current user and another user
// @route   GET /api/direct-chats/:otherUserId
// @access  Private
exports.getDirectMessages = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { otherUserId } = req.params;

    let chat = await DirectChat.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!chat) {
      return res.status(200).json({ chat: null, messages: [] });
    }

    const messages = await DirectMessage.find({ chatId: chat._id })
      .populate("sender", "name profilePicture email")
      .sort({ createdAt: 1 });

    res.status(200).json({ chat, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

// @desc    Send a direct message
// @route   POST /api/direct-chats
// @access  Private
exports.sendDirectMessage = async (req, res) => {
  try {
    const senderId = req.user.id || req.user._id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver and content are required" });
    }

    let chat = await DirectChat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      chat = new DirectChat({
        participants: [senderId, receiverId],
        unreadCounts: { [receiverId.toString()]: 0 },
      });
    }

    const newMessage = new DirectMessage({
      chatId: chat._id,
      sender: senderId,
      content,
    });

    await newMessage.save();

    // Update chat last message and unread count
    chat.lastMessage = newMessage._id;
    
    // Increment unread count for receiver
    const currentUnread = chat.unreadCounts?.get(receiverId.toString()) || 0;
    if (!chat.unreadCounts) chat.unreadCounts = new Map();
    chat.unreadCounts.set(receiverId.toString(), currentUnread + 1);
    
    await chat.save();

    const populatedMessage = await DirectMessage.findById(newMessage._id).populate(
      "sender",
      "name profilePicture email"
    );

    res.status(201).json({ message: populatedMessage, chat });
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).json({ message: "Server error sending direct message" });
  }
};

// @desc    Mark chat as read
// @route   PUT /api/direct-chats/:chatId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { chatId } = req.params;

    const chat = await DirectChat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (!chat.unreadCounts) chat.unreadCounts = new Map();
    chat.unreadCounts.set(userId.toString(), 0);
    await chat.save();

    await DirectMessage.updateMany(
      { chatId, sender: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    console.error("Error marking chat as read:", error);
    res.status(500).json({ message: "Server error marking chat as read" });
  }
};
