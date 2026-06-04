const TaskDiscussion = require("../models/TaskDiscussion");
const TaskMessage = require("../models/TaskMessage");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");

// @desc    Get messages for a task discussion
// @route   GET /api/task-discussions/:taskId
// @access  Private
exports.getTaskDiscussion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id || req.user._id;

    // Verify task exists and user belongs to the same company
    const task = await Task.findOne({ _id: taskId, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Authorization: Admin or assigned to task
    const isAssigned = task.assignedTo && task.assignedTo.some(id => id.toString() === userId.toString());
    const isAdmin = ["admin", "ceo"].includes(req.user.role);
    
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this task discussion" });
    }

    // Mark notifications of type "task_message" for this task as read
    await Notification.updateMany(
      { recipient: userId, task: taskId, type: "task_message", isRead: false },
      { $set: { isRead: true } }
    );

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
      .populate("sender", "name profileImageUrl email")
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
    const task = await Task.findOne({ _id: taskId, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssigned = task.assignedTo && task.assignedTo.some(id => id.toString() === senderId.toString());
    const isAdmin = ["admin", "ceo"].includes(req.user.role);

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
      "name profileImageUrl email"
    );

    // Send notifications to all participants (assigned users + creator) except sender
    const io = req.app.get("io");
    (async () => {
      try {
        const recipientsSet = new Set();
        if (task.assignedTo) {
          task.assignedTo.forEach(id => recipientsSet.add(id.toString()));
        }
        if (task.createdBy) {
          recipientsSet.add(task.createdBy.toString());
        }
        // Remove sender from recipients
        recipientsSet.delete(senderId.toString());

        await Promise.all(Array.from(recipientsSet).map(async (recipientId) => {
          await notificationService.createAndSendNotification({
            recipient: recipientId,
            sender: senderId,
            type: "task_message",
            title: `New Message in ${task.title}`,
            message: `${req.user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            task: task._id,
            io
          });
        }));
      } catch (err) {
        console.error("Error sending task discussion notifications:", err);
      }
    })();

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
      "name profileImageUrl email"
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

    const discussion = await TaskDiscussion.findById(message.discussionId);
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });

    const task = await Task.findById(discussion.task);
    if (!task || task.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    // Sender or admin can delete
    if (message.sender.toString() !== userId.toString() && !["admin", "ceo"].includes(req.user.role)) {
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
