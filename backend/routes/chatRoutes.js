const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");
const validateObjectId = require("../middlewares/validateObjectId");

router.get("/", protect, chatController.getMessages);
router.post("/", protect, chatController.sendMessage);
router.put("/:messageId", protect, validateObjectId, chatController.editMessage);
router.delete("/:messageId", protect, validateObjectId, chatController.deleteMessage);

module.exports = router;
