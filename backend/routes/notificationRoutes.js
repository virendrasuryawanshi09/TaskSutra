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

const router = express.Router();

// Apply protect middleware to all routes below
router.use(protect);

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead);
router.put("/read-type/:type", markNotificationsOfTypeAsRead);
router.put("/:id/read", markAsRead);
router.delete("/clear-all", clearAllNotifications);
router.delete("/:id", deleteNotification);

module.exports = router;
