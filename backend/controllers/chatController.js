const Message = require("../models/Message");
const notificationService = require("../services/notificationService");
const User = require("../models/User");

// Get all messages
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ companyId: req.user.companyId })
      .populate("sender", "name email role profileImageUrl")
      .sort({ createdAt: 1 }); // Sort by creation time ascending
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const newMessage = new Message({
      sender: req.user.id || req.user._id,
      companyId: req.user.companyId,
      content,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "sender",
      "name email role profileImageUrl"
    );

    // Send notifications to all company members except the sender asynchronously
    const io = req.app.get("io");
    (async () => {
      try {
        const usersInCompany = await User.find({
          companyId: req.user.companyId,
          _id: { $ne: req.user.id || req.user._id }
        });
        
        await Promise.all(usersInCompany.map(recipientUser => 
          notificationService.createAndSendNotification({
            recipient: recipientUser._id,
            sender: req.user.id || req.user._id,
            type: "community_chat",
            title: "New Community Message",
            message: `${req.user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            io
          })
        ));
      } catch (err) {
        console.error("Error sending community chat notifications:", err);
      }
    })();

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error sending message" });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id || req.user._id;

    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const message = await Message.findById(messageId);
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

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name email role profileImageUrl"
    );

    res.status(200).json(populatedMessage);
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ message: "Server error editing message" });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id || req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Sender or admin/ceo can delete
    if (message.sender.toString() !== userId.toString() && !["admin", "ceo"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully", messageId });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error deleting message" });
  }
};
