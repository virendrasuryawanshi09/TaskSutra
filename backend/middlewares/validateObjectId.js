const mongoose = require("mongoose");

module.exports = (req, res, next) => {
    for (const key in req.params) {
        if (["id", "messageId", "chatId", "otherUserId", "taskId"].includes(key)) {
            if (!mongoose.Types.ObjectId.isValid(req.params[key])) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid format for parameter: ${key}`
                });
            }
        }
    }
    next();
};
