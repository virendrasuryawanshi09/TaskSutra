const Task = require("../models/Task");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * Enriches a user doc with live task count stats
 */
const enrichUserWithTaskStats = async (user) => {
    const totalTasks = await Task.countDocuments({ assignedTo: user._id });
    const pendingTasks = await Task.countDocuments({ assignedTo: user._id, status: "Pending" });
    const inProgressTasks = await Task.countDocuments({
        assignedTo: user._id,
        status: { $in: ["In Progress", "In-progress", "in-Progress"] }
    });
    const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: "Completed" });
    return { ...user._doc, totalTasks, pendingTasks, inProgressTasks, completedTasks };
};

/**
 * Returns all workspace members (role: member) with task stats
 */
const getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'member' }).select("-password");
        const userWithTaskCounts = await Promise.all(users.map(enrichUserWithTaskStats));
        res.json(userWithTaskCounts);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Returns ALL workspace members (both admin + member) with task stats
 * Used by admin Workspace Members Management page
 */
const getAllWorkspaceMembers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password").sort({ createdAt: -1 });
        const enriched = await Promise.all(users.map(enrichUserWithTaskStats));
        res.json({ success: true, members: enriched, total: enriched.length });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

/**
 * Returns aggregate workspace-level stats for the management dashboard
 */
const getWorkspaceStats = async (req, res) => {
    try {
        const totalMembers = await User.countDocuments({ role: 'member' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const totalTasks = await Task.countDocuments({});
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const pendingTasks = await Task.countDocuments({ status: 'Pending' });
        const inProgressTasks = await Task.countDocuments({
            status: { $in: ["In Progress", "In-progress", "in-Progress"] }
        });

        // Members who have at least one task assigned
        const activeContributors = await Task.distinct('assignedTo');

        res.json({
            success: true,
            stats: {
                totalMembers,
                totalAdmins,
                totalWorkspaceUsers: totalMembers + totalAdmins,
                totalTasks,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                activeContributors: activeContributors.length,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    getAllWorkspaceMembers,
    getWorkspaceStats,
};
