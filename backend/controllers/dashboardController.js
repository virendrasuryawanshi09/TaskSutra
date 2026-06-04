const Task = require('../models/Task');
const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const MAX_RECENT_TASKS = 8;

const getDashboardData = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ message: "No company associated with user" });
        }
        const companyObjectId = new mongoose.Types.ObjectId(companyId.toString());

        // Cache Key pattern: dashboard:<companyId>:admin
        const cacheKey = `dashboard:${companyObjectId.toString()}:admin`;
        
        // Try to fetch from Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            try {
                return res.status(200).json(JSON.parse(cachedData));
            } catch (parseError) {
                console.warn("Failed to parse cached admin dashboard data, falling back to db query:", parseError.message);
            }
        }

        const totalTasks = await Task.countDocuments({ companyId: companyObjectId });
        const pendingTasks = await Task.countDocuments({ companyId: companyObjectId, status: "Pending" });
        const completedTasks = await Task.countDocuments({ companyId: companyObjectId, status: "Completed" });
        const overdueTasks = await Task.countDocuments({
            companyId: companyObjectId,
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() }
        });

        const taskStatuses = ["Pending", "In-progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { companyId: companyObjectId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\+/g, "");
            acc[formattedKey] =
                taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: { companyId: companyObjectId } },
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 },
                },
            },
        ]);

        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = 
                taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
                return acc;
        }, {});

        const recentTasks = await Task.find({ companyId })
        .sort({ createdAt: -1 })
        .limit(MAX_RECENT_TASKS)
        .select("title status priority dueDate createdAt");

        const responseData = {
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        };

        // Cache response for 5 minutes (300 seconds)
        await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 300 });

        res.status(200).json(responseData);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ message: "No company associated with user" });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId.toString());
        const companyObjectId = new mongoose.Types.ObjectId(companyId.toString());

        // Cache Key pattern: dashboard:<companyId>:user:<userId>
        const cacheKey = `dashboard:${companyObjectId.toString()}:user:${userObjectId.toString()}`;
        
        // Try to fetch from Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            try {
                return res.status(200).json(JSON.parse(cachedData));
            } catch (parseError) {
                console.warn("Failed to parse cached user dashboard data, falling back to db query:", parseError.message);
            }
        }

        const totalTasks = await Task.countDocuments({ companyId: companyObjectId, assignedTo: userObjectId });
        const pendingTasks = await Task.countDocuments({ companyId: companyObjectId, assignedTo: userObjectId, status: "Pending" });
        const completedTasks = await Task.countDocuments({ companyId: companyObjectId, assignedTo: userObjectId, status: "Completed" });
        const overdueTasks = await Task.countDocuments({
            companyId: companyObjectId,
            assignedTo: userObjectId,
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() }
        });

        const taskStatuses = ["Pending", "In-progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { companyId: companyObjectId, assignedTo: userObjectId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\+/g, "");
            acc[formattedKey] =
                taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: { companyId: companyObjectId, assignedTo: userObjectId } },
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 },
                },
            },
        ]);

        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = 
                taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
                return acc;
        }, {});

        const recentTasks = await Task.find({ companyId, assignedTo: userId })
        .sort({ createdAt: -1 })
        .limit(MAX_RECENT_TASKS)
        .select("title status priority dueDate createdAt");
        
        const responseData = {
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        };

        // Cache response for 5 minutes (300 seconds)
        await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 300 });

        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getDashboardData,
    getUserDashboardData
};
