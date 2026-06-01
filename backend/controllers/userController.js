const Task = require("../models/Task");
const User = require("../models/User");
const bcrypt = require("bcryptjs");


const getUsers = async (req, res) => {
    try{
        const query = {};
        if (req.user.companyId) {
            query.companyId = req.user.companyId;
        } else {
            // Users without a company can only see themselves
            query._id = req.user._id;
        }

        const users = await User.find({
            ...query,
            role: { $in: ['member', 'admin', 'ceo'] }
        }).select("-password");

        const userWithTaskCounts = await Promise.all(users.map(async(user) => {
            const totalTasks = await Task.countDocuments({
                assignedTo: user._id,
            });
            const pendingTasks = await Task.countDocuments({
                assignedTo: user._id, 
                status: "Pending"
            });
            const inProgressTasks = await Task.countDocuments({
                assignedTo: user._id,
                status: { $in: ["In Progress", "In-progress", "in-Progress"] }
            });
            const completedTasks = await Task.countDocuments({
                assignedTo: user._id, 
                status: "Completed"
            });

            return {
                ...user._doc,
                totalTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks
            };
        }));

        res.json(userWithTaskCounts);
    }catch(error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
}

const getUserById = async (req, res) => {
     try{
         const user = await User.findById(req.params.id).select("-password");
         if(!user) return res.status(404).json({message: "User not found"});

         res.json(user);
    }catch(error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
};

const reorderTasks = async (req, res) => {
    try {
        const { taskOrder } = req.body;
        if (!Array.isArray(taskOrder)) {
            return res.status(400).json({ success: false, message: "taskOrder must be an array of task IDs" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.taskOrder = taskOrder;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Task order updated successfully",
            taskOrder: user.taskOrder
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const getTeamWorkloads = async (companyId) => {
    try {
        const users = await User.find({ companyId, role: "member" }).select("name title skills behavioralProfile");
        const workloads = await Promise.all(
            users.map(async (user) => {
                const activeTasks = await Task.countDocuments({
                    assignedTo: user._id,
                    status: { $in: ["Pending", "In-progress", "In Progress"] }
                });
                return {
                    _id: user._id,
                    name: user.name,
                    title: user.title,
                    skills: user.skills || [],
                    behavioralProfile: user.behavioralProfile,
                    activeTasks
                };
            })
        );
        return workloads;
    } catch (error) {
        throw new Error(`Failed to get team workloads: ${error.message}`);
    }
};

module.exports = {
    getUsers,
    getUserById,
    reorderTasks,
    getTeamWorkloads
};
