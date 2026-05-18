const TaskDiscussion = require("../models/TaskDiscussion");
const TaskMessage = require("../models/TaskMessage");
const Task = require("../models/Task");

// @desc    Get messages for a task discussion
// @route   GET /api/task-discussions/:taskId
// @access  Private
exports.getTaskDiscussion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id || req.user._id;

    // Verify task exists and user is authorized
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Authorization: Admin or assigned to task
    const isAssigned = task.assignedTo && task.assignedTo.some(id => id.toString() === userId.toString());
    const isAdmin = req.user.role === "admin";
    
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this task discussion" });
    }

    let discussion = await TaskDiscussion.findOne({ task: taskId });
    
    if (!discussion) {
      // Create discussion if it doesn't exist yet
      discussion = await TaskDiscussion.create({
        task: taskId,
        participants: task.assignedTo || [] // Pre-fill with assignees
      });
      return res.status(200).json({ discussion, messages: [] });
    }

    const messages = await TaskMessage.find({ discussionId: discussion._id })
      .populate("sender", "name profilePicture email")
      .sort({ createdAt: 1 });

    res.status(200).json({ discussion, messages });
  } catch (error) {
    console.error("Error fetching task discussion:", error);
    res.status(500).json({ message: "Server error fetching task discussion" });
  }
};

// @desc    Send a message to a task discussion
// @route   POST /api/task-discussions/:taskId
// @access  Private
exports.sendTaskMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id || req.user._id;

    if (!content) return res.status(400).json({ message: "Message content is required" });

    // Authorization: Admin or assigned to task
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssigned = task.assignedTo && task.assignedTo.some(id => id.toString() === senderId.toString());
    const isAdmin = req.user.role === "admin";

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to post to this discussion" });
    }

    let discussion = await TaskDiscussion.findOne({ task: taskId });
    if (!discussion) {
      discussion = await TaskDiscussion.create({
        task: taskId,
        participants: task.assignedTo || []
      });
    }

    const newMessage = await TaskMessage.create({
      discussionId: discussion._id,
      sender: senderId,
      content
    });

    discussion.lastMessage = newMessage._id;
    await discussion.save();

    const populatedMessage = await TaskMessage.findById(newMessage._id).populate(
      "sender",
      "name profilePicture email"
    );

    res.status(201).json({ message: populatedMessage, discussion });
  } catch (error) {
    console.error("Error sending task message:", error);
    res.status(500).json({ message: "Server error sending task message" });
  }
};

// @desc    Edit a task discussion message
// @route   PUT /api/task-discussions/message/:messageId
// @access  Private
exports.editTaskMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id || req.user._id;

    if (!content) return res.status(400).json({ message: "Message content is required" });

    const message = await TaskMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Only sender can edit
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await TaskMessage.findById(message._id).populate(
      "sender",
      "name profilePicture email"
    );

    res.status(200).json({ message: populatedMessage });
  } catch (error) {
    console.error("Error editing task message:", error);
    res.status(500).json({ message: "Server error editing task message" });
  }
};

// @desc    Delete a task discussion message
// @route   DELETE /api/task-discussions/message/:messageId
// @access  Private
exports.deleteTaskMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id || req.user._id;

    const message = await TaskMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Sender or admin can delete
    if (message.sender.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await TaskMessage.findByIdAndDelete(messageId);

    const discussion = await TaskDiscussion.findById(message.discussionId);
    if (discussion && discussion.lastMessage && discussion.lastMessage.toString() === messageId) {
      const prevMessage = await TaskMessage.findOne({ discussionId: discussion._id }).sort({ createdAt: -1 });
      discussion.lastMessage = prevMessage ? prevMessage._id : null;
      await discussion.save();
    }

    res.status(200).json({ message: "Message deleted successfully", messageId, taskId: discussion ? discussion.task : null });
  } catch (error) {
    console.error("Error deleting task message:", error);
    res.status(500).json({ message: "Server error deleting task message" });
  }
};
