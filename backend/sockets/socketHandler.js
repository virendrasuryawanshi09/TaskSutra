const { addUser, removeUserBySocketId, getSocketId, getAllUsers } = require("./userSocketMap");
const socketAuth = require("../middlewares/socketAuth");
const Task = require("../models/Task");

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
            io.to(`company_${socket.user.companyId.toString()}`).emit("userOnline", { userId: userIdStr, onlineUsers: getAllUsers() });
        } else {
            io.emit("userOnline", { userId: userIdStr, onlineUsers: getAllUsers() });
        }

        // Helper to verify if receiver belongs to the same company
        const checkCompanyBoundary = (receiverSocketId) => {
            if (!receiverSocketId) return false;
            const receiverSocket = io.sockets.sockets.get(receiverSocketId);
            if (!receiverSocket || !receiverSocket.user) return false;
            return String(receiverSocket.user.companyId || '') === String(socket.user.companyId || '');
        };

        // --- Room based architecture ---
        socket.on("joinTaskRoom", async (taskId) => {
            if (!taskId) return;
            try {
                const task = await Task.findById(taskId).select('companyId');
                if (!task) return;
                if (String(task.companyId || '') !== String(socket.user.companyId || '')) {
                    console.warn(`User ${userIdStr} attempted unauthorized join to task room ${taskId}`);
                    return;
                }
                socket.join(`task_${taskId}`);
                console.log(`User ${userIdStr} joined room: task_${taskId}`);
            } catch (err) {
                console.error("Error joining task room:", err.message);
            }
        });

        socket.on("leaveTaskRoom", (taskId) => {
            if (taskId) {
                socket.leave(`task_${taskId}`);
                console.log(`User ${userIdStr} left room: task_${taskId}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
            const disconnectedUserId = removeUserBySocketId(socket.id);
            
            if (disconnectedUserId) {
                console.log(`User ${disconnectedUserId} went offline`);
                if (socket.user && socket.user.companyId) {
                    io.to(`company_${socket.user.companyId.toString()}`).emit("userOffline", { userId: disconnectedUserId, onlineUsers: getAllUsers() });
                } else {
                    io.emit("userOffline", { userId: disconnectedUserId, onlineUsers: getAllUsers() });
                }
            }
        });
        
        socket.on("reconnect_user", () => {
             console.log(`User ${userIdStr} requested reconnect for socket ${socket.id}`);
             addUser(userIdStr, socket.id);
        });
        
        // --- Global Chat Events ---
        socket.on("send_message", (messageData) => {
            if (!messageData || typeof messageData !== "object" || !messageData.content) {
                return;
            }

            const verifiedMessage = {
                _id: messageData._id,
                content: String(messageData.content).trim(),
                isEdited: !!messageData.isEdited,
                createdAt: messageData.createdAt || new Date().toISOString(),
                sender: {
                    _id: socket.user._id,
                    name: socket.user.name,
                    email: socket.user.email,
                    role: socket.user.role,
                    profileImageUrl: socket.user.profileImageUrl || null
                },
                companyId: socket.user.companyId ? socket.user.companyId.toString() : null
            };

            if (verifiedMessage.content.length > 5000) {
                verifiedMessage.content = verifiedMessage.content.substring(0, 5000);
            }

            if (socket.user.companyId) {
                io.to(`company_${socket.user.companyId.toString()}`).emit("receive_message", verifiedMessage);
            } else {
                io.emit("receive_message", verifiedMessage);
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
            const { receiverId, messageData } = data;
            const receiverSocketId = getSocketId(String(receiverId));
            if (receiverSocketId && checkCompanyBoundary(receiverSocketId)) {
                io.to(receiverSocketId).emit("receive_direct_message", messageData);
            }
        });

        socket.on("dm_typing", (data) => {
             const receiverSocketId = getSocketId(String(data.receiverId));
             if (receiverSocketId && checkCompanyBoundary(receiverSocketId)) {
                 io.to(receiverSocketId).emit("dm_typing", data);
             }
        });

        socket.on("dm_stop_typing", (data) => {
             const receiverSocketId = getSocketId(String(data.receiverId));
             if (receiverSocketId && checkCompanyBoundary(receiverSocketId)) {
                 io.to(receiverSocketId).emit("dm_stop_typing", data);
             }
        });

        socket.on("mark_messages_seen", (data) => {
             const senderSocketId = getSocketId(String(data.senderId));
             if (senderSocketId && checkCompanyBoundary(senderSocketId)) {
                 io.to(senderSocketId).emit("messages_seen", data);
             }
        });

        // --- Task Discussion Events ---
        socket.on("send_task_message", async (data) => {
             const { taskId, messageData } = data;
             if (!taskId) return;
             try {
                 const task = await Task.findById(taskId).select('companyId');
                 if (!task || String(task.companyId || '') !== String(socket.user.companyId || '')) return;
                 io.to(`task_${taskId}`).emit("receive_task_message", messageData);
             } catch (err) {
                 console.error("Error sending task message:", err.message);
             }
        });

        socket.on("task_typing", async (data) => {
             const { taskId } = data;
             if (!taskId) return;
             try {
                 const task = await Task.findById(taskId).select('companyId');
                 if (!task || String(task.companyId || '') !== String(socket.user.companyId || '')) return;
                 socket.to(`task_${taskId}`).emit("task_typing", data);
             } catch (err) {
                 console.error("Error broadcasting task typing:", err.message);
             }
        });

        socket.on("task_stop_typing", async (data) => {
             const { taskId } = data;
             if (!taskId) return;
             try {
                 const task = await Task.findById(taskId).select('companyId');
                 if (!task || String(task.companyId || '') !== String(socket.user.companyId || '')) return;
                 socket.to(`task_${taskId}`).emit("task_stop_typing", data);
             } catch (err) {
                 console.error("Error broadcasting task stop typing:", err.message);
             }
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
            if (receiverSocketId && checkCompanyBoundary(receiverSocketId)) {
                io.to(receiverSocketId).emit("receive_edit_direct_message", messageData);
            }
        });

        socket.on("delete_direct_message", (data) => {
            const { receiverId, messageId, chatId } = data;
            const receiverSocketId = getSocketId(String(receiverId));
            if (receiverSocketId && checkCompanyBoundary(receiverSocketId)) {
                io.to(receiverSocketId).emit("receive_delete_direct_message", { messageId, chatId });
            }
        });

        socket.on("edit_task_message", async (data) => {
             const { taskId, messageData } = data;
             if (!taskId) return;
             try {
                 const task = await Task.findById(taskId).select('companyId');
                 if (!task || String(task.companyId || '') !== String(socket.user.companyId || '')) return;
                 io.to(`task_${taskId}`).emit("receive_edit_task_message", messageData);
             } catch (err) {
                 console.error("Error editing task message:", err.message);
             }
        });

        socket.on("delete_task_message", async (data) => {
             const { taskId, messageId } = data;
             if (!taskId) return;
             try {
                 const task = await Task.findById(taskId).select('companyId');
                 if (!task || String(task.companyId || '') !== String(socket.user.companyId || '')) return;
                 io.to(`task_${taskId}`).emit("receive_delete_task_message", { messageId });
             } catch (err) {
                 console.error("Error deleting task message:", err.message);
             }
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
