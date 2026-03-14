const Task = require('../models/Task');

const getTasks = async (req, res) => {
    try {
    }catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getTaskById = async (req, res) => {
    try {
    }catch (error) {
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
    }= req.body;
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
    res.status(201).json({message: 'Task created successfully', task});

    }catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
    }catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }   
};

const deleteTask = async (req, res) => {
    try {
    }catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }   
};

const updateTaskChecklist = async (req, res) => {
    try {
    }catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }   
};

const getDashboardData = async (req, res) => {
    try {
    }catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserDashboardData = async (req, res) => {
    try {
    }catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
    }catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTaskTodos = async (req, res) => {
    try {
    }catch (error) {
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