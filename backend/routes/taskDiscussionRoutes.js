const express = require("express");
const router = express.Router();
const { 
  getTaskDiscussion, 
  sendTaskMessage,
  editTaskMessage,
  deleteTaskMessage
} = require("../controllers/taskDiscussionController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/:taskId", protect, getTaskDiscussion);
router.post("/:taskId", protect, sendTaskMessage);
router.put("/message/:messageId", protect, editTaskMessage);
router.delete("/message/:messageId", protect, deleteTaskMessage);

module.exports = router;
