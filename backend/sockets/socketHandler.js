const { addUser, removeUserBySocketId, getSocketId, getAllUsers } = require("./userSocketMap");
const socketAuth = require("../middlewares/socketAuth");

module.exports = (io) => {
    // Apply authentication middleware
    io.use(socketAuth);

    io.on("connection", (socket) => {
        console.log(`New socket connection: ${socket.id}`);
        
        // The user ID is attached to the socket by the auth middleware
        const userId = socket.user.id || socket.user._id || (socket.user.user && socket.user.user.id);
        
        if (userId) {
            addUser(userId.toString(), socket.id);
            console.log(`User ${userId} connected with socket ${socket.id}`);
            
            // Broadcast to all clients that this user is online
            io.emit("userOnline", { userId: userId.toString(), onlineUsers: getAllUsers() });
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
                // Broadcast to all clients that this user is offline
                io.emit("userOffline", { userId: disconnectedUserId, onlineUsers: getAllUsers() });
            }
        });
        
        // Handle explicit reconnection requests if needed
        socket.on("reconnect_user", () => {
             console.log(`User ${userId} requested reconnect for socket ${socket.id}`);
             addUser(userId.toString(), socket.id);
        });
        
        // --- Global Chat Events ---
        socket.on("send_message", (messageData) => {
            // messageData should contain { content, sender, createdAt } populated
            // Broadcast to all connected clients
            io.emit("receive_message", messageData);
        });

        socket.on("typing", (data) => {
             // data should contain { userId, name }
             socket.broadcast.emit("typing", data);
        });

        socket.on("stop_typing", (data) => {
             // data should contain { userId }
             socket.broadcast.emit("stop_typing", data);
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

        socket.on("error", (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });
};
