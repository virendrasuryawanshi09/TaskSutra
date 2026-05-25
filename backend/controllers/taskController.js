const Task = require('../models/Task');
const mongoose = require('mongoose');
const { createAndSendNotification } = require('../services/notificationService');
const MAX_RECENT_TASKS = 8;

const normalizeTaskStatus = (status = '') => {
    const normalizedValue = String(status).trim().toLowerCase();

    if (normalizedValue === 'completed') return 'Completed';
    if (['in progress', 'in-progress', 'inprogress'].includes(normalizedValue)) {
        return 'In-progress';
    }

    return 'Pending';
};

const getTodoChecklist = (task) => {
    if (Array.isArray(task?.todoChecklist)) {
        return task.todoChecklist;
    }

    if (Array.isArray(task?.todoCheckList)) {
        return task.todoCheckList;
    }

    return [];
};

const getTasks = async (req, res) => {
    try {

        const { status } = req.query;
        let filter = {};

        if (status) {
            filter.status = status;
        }

        // Enforce company boundary isolation
        const companyId = req.user.companyId;
        filter.companyId = companyId;

        let tasks;

        const hasFullAccess = ['admin', 'ceo'].includes(req.user.role);

        // Admin/CEO can see all tasks
        if (hasFullAccess) {
            tasks = await Task.find(filter).populate(
                'assignedTo',
                'name email profileImageUrl'
            );
        }
        // Normal user sees only assigned tasks
        else {
            tasks = await Task.find({
                ...filter,
                assignedTo: req.user._id
            }).populate(
                'assignedTo',
                'name email profileImageUrl'
            );
        }

        // Add completed checklist count
        tasks = await Promise.all(
            tasks.map(async (task) => {
                const completedCount = getTodoChecklist(task).filter(
                    (item) => item.completed
                ).length;

                return {
                    ...task._doc,
                    completedChecklistCount: completedCount
                };
            })
        );

        // Count all tasks
        const allTasks = await Task.countDocuments(
            hasFullAccess
                ? { companyId }
                : { companyId, assignedTo: req.user._id }
        );

        // Pending tasks
        const pendingTasks = await Task.countDocuments({
            status: 'Pending',
            companyId,
            ...(!hasFullAccess && { assignedTo: req.user._id })
        });

        // In-progress tasks
        const inProgressTasks = await Task.countDocuments({
            status: 'In-progress',
            companyId,
            ...(!hasFullAccess && { assignedTo: req.user._id })
        });

        // Completed tasks
        const completedTasks = await Task.countDocuments({
            status: 'Completed',
            companyId,
            ...(!hasFullAccess && { assignedTo: req.user._id })
        });

        res.json({
            tasks,
            statusSummary: {
                allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate(
            'assignedTo',
            'name email profileImageUrl'
        );
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Enforce company boundary isolation
        if (String(task.companyId || '') !== String(req.user.companyId || '')) {
            return res.status(403).json({ message: 'You are not authorized to view this task' });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoCheckList,
        } = req.body;
        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: 'Assigned users must be an array of user IDs' });
        }

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user._id,
            companyId: req.user.companyId,
            todoChecklist: Array.isArray(todoCheckList) ? todoCheckList : [],
            attachments,
        });

        // Trigger notifications
        const io = req.app.get("io");
        const notificationPromises = assignedTo.map(userId => 
            createAndSendNotification({
                recipient: userId,
                sender: req.user._id,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You have been assigned to the task: "${task.title}"`,
                task: task._id,
                io
            })
        );
        await Promise.all(notificationPromises);

        res.status(201).json({ message: 'Task created successfully', task });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid task ID" });
        }
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Enforce company boundary isolation
        if (String(task.companyId || '') !== String(req.user.companyId || '')) {
            return res.status(403).json({ message: 'You are not authorized to update this task' });
        }

        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        );
        const isCreator = task.createdBy && task.createdBy.toString() === req.user._id.toString();
        const hasFullAccess = ['admin', 'ceo'].includes(req.user.role);

        if (!isAssigned && !isCreator && !hasFullAccess) {
            return res.status(403).json({ message: 'You are not authorized to update this task' });
        }

        const io = req.app.get("io");
        const oldAssigned = task.assignedTo.map(id => id.toString());

        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        if (Array.isArray(req.body.todoCheckList)) {
            task.todoChecklist = req.body.todoCheckList;
        }
        task.attachments = req.body.attachments || task.attachments;

        let newlyAssigned = [];
        let unassigned = [];
        let keptAssigned = [...oldAssigned];

        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: 'Assigned users must be an array of user IDs' });
            }
            const newAssigned = req.body.assignedTo.map(id => id.toString());
            newlyAssigned = newAssigned.filter(id => !oldAssigned.includes(id));
            unassigned = oldAssigned.filter(id => !newAssigned.includes(id));
            keptAssigned = newAssigned.filter(id => oldAssigned.includes(id));
            task.assignedTo = req.body.assignedTo;
        }

        const updatedTask = await task.save();

        // Trigger notifications
        const notificationPromises = [];
        
        newlyAssigned.forEach(userId => {
            notificationPromises.push(
                createAndSendNotification({
                    recipient: userId,
                    sender: req.user._id,
                    type: 'task_assigned',
                    title: 'New Task Assigned',
                    message: `You have been assigned to the task: "${updatedTask.title}"`,
                    task: updatedTask._id,
                    io
                })
            );
        });

        unassigned.forEach(userId => {
            notificationPromises.push(
                createAndSendNotification({
                    recipient: userId,
                    sender: req.user._id,
                    type: 'task_unassigned',
                    title: 'Task Unassigned',
                    message: `You have been unassigned from the task: "${updatedTask.title}"`,
                    task: updatedTask._id,
                    io
                })
            );
        });

        keptAssigned.forEach(userId => {
            notificationPromises.push(
                createAndSendNotification({
                    recipient: userId,
                    sender: req.user._id,
                    type: 'task_updated',
                    title: 'Task Updated',
                    message: `The task "${updatedTask.title}" has been updated by ${req.user.name || 'an administrator'}.`,
                    task: updatedTask._id,
                    io
                })
            );
        });

        await Promise.all(notificationPromises);

        res.json({ message: 'Task updated successfully', task: updatedTask });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Enforce company boundary isolation
        if (String(task.companyId || '') !== String(req.user.companyId || '')) {
            return res.status(403).json({ message: 'You are not authorized to delete this task' });
        }

        const io = req.app.get("io");
        const assignedUsers = task.assignedTo.map(id => id.toString());
        const taskTitle = task.title;

        await task.deleteOne();

        const notificationPromises = assignedUsers.map(userId =>
            createAndSendNotification({
                recipient: userId,
                sender: req.user._id,
                type: 'task_deleted',
                title: 'Task Deleted',
                message: `The task "${taskTitle}" has been deleted by ${req.user.name}.`,
                io
            })
        );
        await Promise.all(notificationPromises);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTaskChecklist = async (req, res) => {
    try {
        const { todoCheckList } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Enforce company boundary isolation
        if (String(task.companyId || '') !== String(req.user.companyId || '')) {
            return res.status(403).json({ message: 'You are not authorized to update this task checklist' });
        }

        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        );
        const hasFullAccess = ['admin', 'ceo'].includes(req.user.role);
        if (!isAssigned && !hasFullAccess) {
            return res.status(403).json({ message: 'You are not authorized to update this task checklist' });
        }

        task.todoChecklist = Array.isArray(todoCheckList) ? todoCheckList : [];

        const completedCount = getTodoChecklist(task).filter(
            (item) => item.completed
        ).length;

        const totalItems = getTodoChecklist(task).length;

        task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        if (task.progress === 100) {
            task.status = 'Completed';
        } else if (task.progress > 0) {
            task.status = 'In-progress';
        } else {
            task.status = 'Pending';
        }

        const updatedTask = await task.save();

        // Trigger notifications
        const io = req.app.get("io");
        const notifyRecipients = new Set();
        task.assignedTo.forEach(id => notifyRecipients.add(id.toString()));
        if (task.createdBy) {
            notifyRecipients.add(task.createdBy.toString());
        }
        notifyRecipients.delete(req.user._id.toString());

        const notificationPromises = Array.from(notifyRecipients).map(userId =>
            createAndSendNotification({
                recipient: userId,
                sender: req.user._id,
                type: 'task_updated',
                title: 'Task Checklist Updated',
                message: `The checklist for "${updatedTask.title}" was updated by ${req.user.name}. Progress is now ${updatedTask.progress}%.`,
                task: updatedTask._id,
                io
            })
        );
        await Promise.all(notificationPromises);

        const populatedTask = await Task.findById(req.params.id).populate(
            'assignedTo',
            'name email profileImageUrl'
        );
        res.json({ message: 'Task checklist updated successfully', task: populatedTask });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getDashboardData = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const totalTasks = await Task.countDocuments({ companyId });
        const pendingTasks = await Task.countDocuments({ companyId, status: "Pending" });
        const completedTasks = await Task.countDocuments({ companyId, status: "Completed" });
        const overdueTasks = await Task.countDocuments({
            companyId,
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() }
        });

        const taskStatuses = ["Pending", "In-progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { companyId } },
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
            { $match: { companyId } },
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

        res.status(200).json({
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
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;
        const companyId = req.user.companyId;

        const totalTasks = await Task.countDocuments({ companyId, assignedTo: userId });
        const pendingTasks = await Task.countDocuments({ companyId, assignedTo: userId, status: "Pending" });
        const completedTasks = await Task.countDocuments({ companyId, assignedTo: userId, status: "Completed" });
        const overdueTasks = await Task.countDocuments({
            companyId,
            assignedTo: userId,
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() }
        });

        const taskStatuses = ["Pending", "In-progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { companyId, assignedTo: userId } },
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
            { $match: { companyId, assignedTo: userId } },
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
        
        res.status(200).json({
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
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Enforce company boundary isolation
        if (String(task.companyId || '') !== String(req.user.companyId || '')) {
            return res.status(403).json({ message: 'You are not authorized to update this task status' });
        }

        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        );
        const hasFullAccess = ['admin', 'ceo'].includes(req.user.role);

        if (!isAssigned && !hasFullAccess) {
            return res.status(403).json({ message: 'You are not authorized to update this task status' });
        }

        task.status = normalizeTaskStatus(req.body.status || task.status);

        if (task.status === 'Completed') {
            task.todoChecklist = getTodoChecklist(task).map((item) => ({
                ...item.toObject?.(),
                ...item,
                completed: true,
            }));
            task.progress = 100;
        } else if (task.status === 'Pending') {
            task.progress = 0;
        }

        await task.save();

        // Trigger notifications
        const io = req.app.get("io");
        const notifyRecipients = new Set();
        task.assignedTo.forEach(id => notifyRecipients.add(id.toString()));
        if (task.createdBy) {
            notifyRecipients.add(task.createdBy.toString());
        }
        notifyRecipients.delete(req.user._id.toString());

        const notificationPromises = Array.from(notifyRecipients).map(userId =>
            createAndSendNotification({
                recipient: userId,
                sender: req.user._id,
                type: 'task_updated',
                title: 'Task Status Updated',
                message: `The status of task "${task.title}" was updated to "${task.status}" by ${req.user.name}.`,
                task: task._id,
                io
            })
        );
        await Promise.all(notificationPromises);

        res.json({ message: 'Task status updated successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });

    }
};

const updateTaskTodos = async (req, res) => {
    return updateTaskChecklist(req, res);
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData,
    updateTaskStatus,
    updateTaskTodos
};
