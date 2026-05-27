const DirectChat = require("../models/DirectChat");
const DirectMessage = require("../models/DirectMessage");
const notificationService = require("../services/notificationService");
const Notification = require("../models/Notification");

// @desc    Get all direct chats for the current user
// @route   GET /api/direct-chats
// @access  Private
exports.getDirectChats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const chats = await DirectChat.find({ participants: userId })
      .populate("participants", "name profileImageUrl email role")
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
      .populate("sender", "name profileImageUrl email")
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
      chat = await DirectChat.create({
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
      "name profileImageUrl email"
    );

    // Send notification to the receiver asynchronously
    const io = req.app.get("io");
    (async () => {
      try {
        await notificationService.createAndSendNotification({
          recipient: receiverId,
          sender: senderId,
          type: "direct_message",
          title: "New Direct Message",
          message: `${req.user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          io
        });
      } catch (err) {
        console.error("Error sending direct message notification:", err);
      }
    })();

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

    // Also mark notifications for this direct chat as read
    const otherParticipantId = chat.participants.find(p => p.toString() !== userId.toString());
    if (otherParticipantId) {
      await Notification.updateMany(
        { recipient: userId, sender: otherParticipantId, type: "direct_message", isRead: false },
        { $set: { isRead: true } }
      );
    }

    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    console.error("Error marking chat as read:", error);
    res.status(500).json({ message: "Server error marking chat as read" });
  }
};

// @desc    Edit a direct message
// @route   PUT /api/direct-chats/message/:messageId
// @access  Private
exports.editDirectMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id || req.user._id;

    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const message = await DirectMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can edit
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await DirectMessage.findById(message._id).populate(
      "sender",
      "name profileImageUrl email"
    );

    res.status(200).json({ message: populatedMessage });
  } catch (error) {
    console.error("Error editing direct message:", error);
    res.status(500).json({ message: "Server error editing direct message" });
  }
};

// @desc    Delete a direct message
// @route   DELETE /api/direct-chats/message/:messageId
// @access  Private
exports.deleteDirectMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id || req.user._id;

    const message = await DirectMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Sender or admin/ceo can delete
    if (message.sender.toString() !== userId.toString() && !["admin", "ceo"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await DirectMessage.findByIdAndDelete(messageId);

    const chat = await DirectChat.findById(message.chatId);
    if (chat && chat.lastMessage && chat.lastMessage.toString() === messageId) {
      // Find the previous message
      const prevMessage = await DirectMessage.findOne({ chatId: chat._id }).sort({ createdAt: -1 });
      chat.lastMessage = prevMessage ? prevMessage._id : null;
      await chat.save();
    }

    res.status(200).json({ message: "Message deleted successfully", messageId, chatId: message.chatId });
  } catch (error) {
    console.error("Error deleting direct message:", error);
    res.status(500).json({ message: "Server error deleting direct message" });
  }
};
