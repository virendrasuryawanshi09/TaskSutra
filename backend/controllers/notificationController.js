const Notification = require("../models/Notification");

// Get all notifications for the logged-in user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate("sender", "name email profileImageUrl")
            .populate("task", "title")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            notifications,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Mark a single notification as read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        // Verify recipient matches logged in user
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized action" });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Delete a single notification
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        // Verify recipient matches logged in user
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized action" });
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Clear all notifications for the user
const clearAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });

        res.status(200).json({
            success: true,
            message: "All notifications cleared",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
};
