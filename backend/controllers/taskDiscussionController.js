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
