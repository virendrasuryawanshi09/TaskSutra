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
const validateObjectId = require("../middlewares/validateObjectId");

router.get("/", protect, getDirectChats);
router.post("/", protect, sendDirectMessage);
router.get("/:otherUserId", protect, validateObjectId, getDirectMessages);
router.put("/:chatId/read", protect, validateObjectId, markAsRead);
router.put("/message/:messageId", protect, validateObjectId, editDirectMessage);
router.delete("/message/:messageId", protect, validateObjectId, deleteDirectMessage);

module.exports = router;
