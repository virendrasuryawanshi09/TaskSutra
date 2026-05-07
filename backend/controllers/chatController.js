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
