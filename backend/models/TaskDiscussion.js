const mongoose = require("mongoose");

const taskDiscussionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      unique: true, // One discussion per task
    },
    // We can cache participants here or just rely on task assignees/admin logic
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskMessage",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaskDiscussion", taskDiscussionSchema);
