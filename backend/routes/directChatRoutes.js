const express = require("express");
const router = express.Router();
const {
  getDirectChats,
  getDirectMessages,
  sendDirectMessage,
  markAsRead,
} = require("../controllers/directChatController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, getDirectChats);
router.post("/", protect, sendDirectMessage);
router.get("/:otherUserId", protect, getDirectMessages);
router.put("/:chatId/read", protect, markAsRead);

module.exports = router;
