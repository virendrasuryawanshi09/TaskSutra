const { addUser, removeUserBySocketId, getSocketId, getAllUsers } = require("./userSocketMap");
const socketAuth = require("../middlewares/socketAuth");

module.exports = (io) => {
    // Apply authentication middleware
    io.use(socketAuth);

    io.on("connection", (socket) => {
        console.log(`New socket connection: ${socket.id}`);
        
        // Ensure socket.user exists and has a valid ID
        if (!socket.user) {
            console.error(`Socket connection ${socket.id} has no authenticated user. Disconnecting.`);
            socket.disconnect(true);
            return;
        }

        const userId = socket.user._id || socket.user.id;
        if (!userId) {
            console.error(`Socket connection ${socket.id} user has no valid ID. Disconnecting.`);
            socket.disconnect(true);
            return;
        }
        
        const userIdStr = userId.toString();
        addUser(userIdStr, socket.id);
        console.log(`User ${userIdStr} connected with socket ${socket.id}`);
        
        // Join the user to their company room if they are associated with a company
        if (socket.user.companyId) {
            socket.join(`company_${socket.user.companyId.toString()}`);
            console.log(`User ${userIdStr} joined company room: company_${socket.user.companyId}`);
            // Broadcast only to their company that they are online
            io.to(`company_${socket.user.companyId.toString()}`).emit("userOnline", { userId: userIdStr, onlineUsers: getAllUsers() });
        } else {
            io.emit("userOnline", { userId: userIdStr, onlineUsers: getAllUsers() });
        }

        // --- Room based architecture ---
        socket.on("joinTaskRoom", (taskId) => {
            if (taskId) {
                socket.join(`task_${taskId}`);
                console.log(`User ${userId} joined room: task_${taskId}`);
            }
        });

        socket.on("leaveTaskRoom", (taskId) => {
            if (taskId) {
                socket.leave(`task_${taskId}`);
                console.log(`User ${userId} left room: task_${taskId}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
            const disconnectedUserId = removeUserBySocketId(socket.id);
            
            if (disconnectedUserId) {
                console.log(`User ${disconnectedUserId} went offline`);
                // Broadcast only to their company that they are offline
                if (socket.user && socket.user.companyId) {
                    io.to(`company_${socket.user.companyId.toString()}`).emit("userOffline", { userId: disconnectedUserId, onlineUsers: getAllUsers() });
                } else {
                    io.emit("userOffline", { userId: disconnectedUserId, onlineUsers: getAllUsers() });
                }
            }
        });
        
        // Handle explicit reconnection requests if needed
        socket.on("reconnect_user", () => {
             console.log(`User ${userId} requested reconnect for socket ${socket.id}`);
             addUser(userId.toString(), socket.id);
        });
        
        // --- Global Chat Events ---
        socket.on("send_message", (messageData) => {
            if (socket.user && socket.user.companyId) {
                io.to(`company_${socket.user.companyId.toString()}`).emit("receive_message", messageData);
            } else {
                io.emit("receive_message", messageData);
            }
        });

        socket.on("typing", (data) => {
             if (socket.user && socket.user.companyId) {
                 socket.to(`company_${socket.user.companyId.toString()}`).emit("typing", data);
             } else {
                 socket.broadcast.emit("typing", data);
             }
        });

        socket.on("stop_typing", (data) => {
             if (socket.user && socket.user.companyId) {
                 socket.to(`company_${socket.user.companyId.toString()}`).emit("stop_typing", data);
             } else {
                 socket.broadcast.emit("stop_typing", data);
             }
        });

        // --- Direct Messaging Events ---
        socket.on("send_direct_message", (data) => {
            // data should contain { receiverId, messageData }
            const { receiverId, messageData } = data;
            const receiverSocketId = getSocketId(String(receiverId));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_direct_message", messageData);
            }
        });

        socket.on("dm_typing", (data) => {
             // data should contain { receiverId, senderId, name }
             const receiverSocketId = getSocketId(String(data.receiverId));
             if (receiverSocketId) {
                 io.to(receiverSocketId).emit("dm_typing", data);
             }
        });

        socket.on("dm_stop_typing", (data) => {
             // data should contain { receiverId, senderId }
             const receiverSocketId = getSocketId(String(data.receiverId));
             if (receiverSocketId) {
                 io.to(receiverSocketId).emit("dm_stop_typing", data);
             }
        });

        socket.on("mark_messages_seen", (data) => {
             // data should contain { chatId, readerId, senderId }
             const senderSocketId = getSocketId(String(data.senderId));
             if (senderSocketId) {
                 io.to(senderSocketId).emit("messages_seen", data);
             }
        });

        // --- Task Discussion Events ---
        socket.on("send_task_message", (data) => {
             // data should contain { taskId, messageData }
             const { taskId, messageData } = data;
             // Broadcast to everyone in the task room
             io.to(`task_${taskId}`).emit("receive_task_message", messageData);
        });

        socket.on("task_typing", (data) => {
             // data should contain { taskId, userId, name }
             socket.to(`task_${data.taskId}`).emit("task_typing", data);
        });

        socket.on("task_stop_typing", (data) => {
             // data should contain { taskId, userId }
             socket.to(`task_${data.taskId}`).emit("task_stop_typing", data);
        });

        // --- Edit/Delete Message Events ---
        socket.on("edit_message", (messageData) => {
            if (socket.user && socket.user.companyId) {
                io.to(`company_${socket.user.companyId.toString()}`).emit("receive_edit_message", messageData);
            } else {
                io.emit("receive_edit_message", messageData);
            }
        });

        socket.on("delete_message", (data) => {
            if (socket.user && socket.user.companyId) {
                io.to(`company_${socket.user.companyId.toString()}`).emit("receive_delete_message", data);
            } else {
                io.emit("receive_delete_message", data);
            }
        });

        socket.on("edit_direct_message", (data) => {
            const { receiverId, messageData } = data;
            const receiverSocketId = getSocketId(String(receiverId));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_edit_direct_message", messageData);
            }
        });

        socket.on("delete_direct_message", (data) => {
            const { receiverId, messageId, chatId } = data;
            const receiverSocketId = getSocketId(String(receiverId));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_delete_direct_message", { messageId, chatId });
            }
        });

        socket.on("edit_task_message", (data) => {
             const { taskId, messageData } = data;
             io.to(`task_${taskId}`).emit("receive_edit_task_message", messageData);
        });

        socket.on("delete_task_message", (data) => {
             const { taskId, messageId } = data;
             io.to(`task_${taskId}`).emit("receive_delete_task_message", { messageId });
        });

        // --- Task Synchronization Events ---
        socket.on("task_updated", (taskData) => {
             if (socket.user && socket.user.companyId) {
                 socket.to(`company_${socket.user.companyId.toString()}`).emit("task_sync", { action: "update", task: taskData });
             } else {
                 socket.broadcast.emit("task_sync", { action: "update", task: taskData });
             }
        });

        socket.on("task_created", (taskData) => {
             if (socket.user && socket.user.companyId) {
                 socket.to(`company_${socket.user.companyId.toString()}`).emit("task_sync", { action: "create", task: taskData });
             } else {
                 socket.broadcast.emit("task_sync", { action: "create", task: taskData });
             }
        });

        socket.on("task_deleted", (taskId) => {
             if (socket.user && socket.user.companyId) {
                 socket.to(`company_${socket.user.companyId.toString()}`).emit("task_sync", { action: "delete", taskId });
             } else {
                 socket.broadcast.emit("task_sync", { action: "delete", taskId });
             }
        });

        socket.on("error", (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });
};
