const Message = require("../models/Message");

// Get all messages
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("sender", "name email role profilePicture")
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
      content,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "sender",
      "name email role profilePicture"
    );

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
      "name email role profilePicture"
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

    // Sender or admin can delete
    if (message.sender.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully", messageId });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error deleting message" });
  }
};
