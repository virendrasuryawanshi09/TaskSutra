const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    markNotificationsOfTypeAsRead,
} = require("../controllers/notificationController");
const validateObjectId = require("../middlewares/validateObjectId");

const router = express.Router();

// Apply protect middleware to all routes below
router.use(protect);

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead);
router.put("/read-type/:type", markNotificationsOfTypeAsRead);
router.put("/:id/read", validateObjectId, markAsRead);
router.delete("/clear-all", clearAllNotifications);
router.delete("/:id", validateObjectId, deleteNotification);

module.exports = router;
