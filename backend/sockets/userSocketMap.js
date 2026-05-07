// Map to track connected users and their socket IDs
// Key: userId, Value: socketId
const userSocketMap = new Map();

const addUser = (userId, socketId) => {
    userSocketMap.set(userId, socketId);
};

const removeUser = (userId) => {
    userSocketMap.delete(userId);
};

const removeUserBySocketId = (socketId) => {
    for (let [key, value] of userSocketMap.entries()) {
        if (value === socketId) {
            userSocketMap.delete(key);
            return key; // Return the userId that was removed
        }
    }
    return null;
};

const getSocketId = (userId) => {
    return userSocketMap.get(userId);
};

const getAllUsers = () => {
    return Array.from(userSocketMap.keys());
};

module.exports = {
    addUser,
    removeUser,
    removeUserBySocketId,
    getSocketId,
    getAllUsers,
    userSocketMap
};
