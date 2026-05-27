const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, chatController.getMessages);
router.post("/", protect, chatController.sendMessage);
router.put("/:messageId", protect, chatController.editMessage);
router.delete("/:messageId", protect, chatController.deleteMessage);

module.exports = router;
