require ("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const socketHandler = require("./sockets/socketHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");
const chatRoutes = require("./routes/chatRoutes");
const directChatRoutes = require("./routes/directChatRoutes");
const taskDiscussionRoutes = require("./routes/taskDiscussionRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5000"], // Add your frontend origins here
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Initialize socket handler
socketHandler(io);
app.set("io", io);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      // allow local development origins on any port
      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        return callback(null, true);
      }

      // block others
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/direct-chats", directChatRoutes);
app.use("/api/task-discussions", taskDiscussionRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server connection error:", error);
        process.exit(1);
    }
};

startServer();
