const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing from backend/.env");
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        throw err;
    }
};

module.exports = connectDB;
