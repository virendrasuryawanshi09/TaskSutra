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
const aiRoutes = require("./routes/aiRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || 
          origin.startsWith("http://localhost") || 
          origin.startsWith("http://127.0.0.1") || 
          (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) ||
          origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
      if (!origin) return callback(null, true);

      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Security Headers (Lighthouse Best Practices fixes) ──────────────────────
app.use((req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || "https://tasksutra.app";

  // Content-Security-Policy — whitelists Groq AI API so features keep working
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `connect-src 'self' ${frontendUrl} https://api.groq.com wss: ws:`,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // Cross-Origin Opener Policy — fixes COOP Lighthouse warning
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  // Cross-Origin Resource Policy
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  // X-Frame-Options — prevents clickjacking (XFO header)
  res.setHeader("X-Frame-Options", "DENY");

  // X-Content-Type-Options — prevents MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy — restricts access to sensitive browser APIs
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  next();
});
// ─────────────────────────────────────────────────────────────────────────────


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
app.use("/api/ai", aiRoutes);


// 404 catch-all — must be after all routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    // Format Mongoose invalid ObjectId CastErrors cleanly as 400 Bad Request
    if (err.name === "CastError" && err.kind === "ObjectId") {
        return res.status(400).json({
            success: false,
            message: `Invalid resource identifier format: ${err.value}`
        });
    }

    console.error("Unhandled Error:", err);
    res.status(err.status || err.statusCode || 500).json({
        success: false,
        message: err.message || "An internal server error occurred",
        ...(process.env.NODE_ENV === "development" && { error: err.stack })
    });
});



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
