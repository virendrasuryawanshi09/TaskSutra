const express = require("express");
const router = express.Router();
const {
  getDirectChats,
  getDirectMessages,
  sendDirectMessage,
  markAsRead,
  editDirectMessage,
  deleteDirectMessage,
} = require("../controllers/directChatController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, getDirectChats);
router.post("/", protect, sendDirectMessage);
router.get("/:otherUserId", protect, getDirectMessages);
router.put("/:chatId/read", protect, markAsRead);
router.put("/message/:messageId", protect, editDirectMessage);
router.delete("/message/:messageId", protect, deleteDirectMessage);

module.exports = router;
