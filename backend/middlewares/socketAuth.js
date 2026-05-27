const jwt = require("jsonwebtoken");
const User = require("../models/User");

const socketAuth = async (socket, next) => {
    try {
        // Token can be passed in auth or query
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return next(new Error("Authentication error: User no longer exists"));
        }
        socket.user = user; // Attach user info to socket
        next();
    } catch (error) {
        console.error("Socket authentication error:", error.message);
        return next(new Error("Authentication error: Invalid token"));
    }
};

module.exports = socketAuth;
