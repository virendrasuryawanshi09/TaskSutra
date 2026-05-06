const jwt = require("jsonwebtoken");

const socketAuth = (socket, next) => {
    try {
        // Token can be passed in auth or query
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Attach user info to socket
        next();
    } catch (error) {
        console.error("Socket authentication error:", error.message);
        return next(new Error("Authentication error: Invalid token"));
    }
};

module.exports = socketAuth;
