const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (token && token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user no longer exists' });
            }
            req.user = user;
            next();
        } else {
            res.status(401).json({ message: 'Not authorized, no token' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, it is admin only access' });
    }
};

const ceoOnly = (req, res, next) => {
    if (req.user && req.user.role === "ceo") {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, CEO privileges required' });
    }
};

const adminOrCeo = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "ceo")) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, Admin or CEO privileges required' });
    }
};

module.exports = { protect, adminOnly, ceoOnly, adminOrCeo };