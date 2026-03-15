const Task = require('../models/Task');

const getTasks = async (req, res) => {
    try {

        const { status } = req.query;
        let filter = {};

        if (status) {
            filter.status = status;
        }

        let tasks;

        // Admin can see all tasks
        if (req.user.role === 'admin') {
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
                const completedCount = task.todoCheckList.filter(
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
            req.user.role === 'admin'
                ? {}
                : { assignedTo: req.user._id }
        );

        // Pending tasks
        const pendingTasks = await Task.countDocuments({
            status: 'pending',
            ...(req.user.role !== 'admin' && { assignedTo: req.user._id })
        });

        // In-progress tasks
        const inProgressTasks = await Task.countDocuments({
            status: 'in-progress',
            ...(req.user.role !== 'admin' && { assignedTo: req.user._id })
        });

        // Completed tasks
        const completedTasks = await Task.countDocuments({
            status: 'completed',
            ...(req.user.role !== 'admin' && { assignedTo: req.user._id })
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
        if(!task) {
            return res.status(404).json({ message: 'Task not found' });
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
            todoCheckList,
            attachments,
        });
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
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoCheckList = req.body.todoCheckList || task.todoCheckList;
        task.attachments = req.body.attachments || task.attachments;

        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: 'Assigned users must be an array of user IDs' });
            }
            task.assignedTo = req.body.assignedTo;
        }
        const updatedTask = await task.save();
        res.json({ message: 'Task updated successfully', task: updatedTask });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTaskChecklist = async (req, res) => {
    try {
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getDashboardData = async (req, res) => {
    try {
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserDashboardData = async (req, res) => {
    try {
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTaskTodos = async (req, res) => {
    try {
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
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