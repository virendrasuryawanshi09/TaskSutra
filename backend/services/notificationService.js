const Notification = require("../models/Notification");
const { getSocketId } = require("../sockets/userSocketMap");

/**
 * Service to handle creating, saving, and broadcasting notifications via WebSockets.
 */
const createAndSendNotification = async ({ recipient, sender, type, title, message, task, io }) => {
    try {
        // Don't send notification to oneself
        if (String(recipient) === String(sender)) {
            return null;
        }

        // 1. Save notification to database
        const notification = await Notification.create({
            recipient,
            sender,
            type,
            title,
            message,
            task
        });

        // 2. Populate notification details
        const populatedNotification = await Notification.findById(notification._id)
            .populate("sender", "name email profileImageUrl")
            .populate("task", "title");

        // 3. Emit via socket.io if the recipient is currently online
        if (io) {
            const socketId = getSocketId(String(recipient));
            if (socketId) {
                io.to(socketId).emit("new_notification", populatedNotification);
            }
        }
        return populatedNotification;
    } catch (error) {
        console.error("Error creating/sending notification:", error);
    }
};

module.exports = {
    createAndSendNotification
};
