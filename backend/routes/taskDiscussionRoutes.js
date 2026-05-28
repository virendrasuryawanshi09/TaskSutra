const express = require("express");
const router = express.Router();
const { 
  getTaskDiscussion, 
  sendTaskMessage,
  editTaskMessage,
  deleteTaskMessage
} = require("../controllers/taskDiscussionController");
const { protect } = require("../middlewares/authMiddleware");
const validateObjectId = require("../middlewares/validateObjectId");

router.get("/:taskId", protect, validateObjectId, getTaskDiscussion);
router.post("/:taskId", protect, validateObjectId, sendTaskMessage);
router.put("/message/:messageId", protect, validateObjectId, editTaskMessage);
router.delete("/message/:messageId", protect, validateObjectId, deleteTaskMessage);

module.exports = router;
