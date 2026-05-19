const express = require("express");
const { adminOnly, protect } = require("../middlewares/authMiddleware");
const {
    getUsers,
    getUserById,
    getAllWorkspaceMembers,
    getWorkspaceStats,
} = require("../controllers/userController");

const router = express.Router();

// Public (authenticated) routes
router.get("/", protect, getUsers);
router.get("/:id", protect, getUserById);

// Admin-only workspace management routes
router.get("/workspace/members", protect, adminOnly, getAllWorkspaceMembers);
router.get("/workspace/stats", protect, adminOnly, getWorkspaceStats);

module.exports = router;