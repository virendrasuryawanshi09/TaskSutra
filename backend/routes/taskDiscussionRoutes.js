const express = require("express");
const router = express.Router();
const { getTaskDiscussion, sendTaskMessage } = require("../controllers/taskDiscussionController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/:taskId", protect, getTaskDiscussion);
router.post("/:taskId", protect, sendTaskMessage);

module.exports = router;
