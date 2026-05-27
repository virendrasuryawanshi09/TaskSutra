const express = require('express');
const {protect, adminOrCeo} = require('../middlewares/authMiddleware');
const {getUserDashboardData , updateTaskStatus, getDashboardData, getTasks, getTaskById, createTask, updateTask, deleteTask, updateTaskChecklist} = require('../controllers/taskController');

const router = express.Router();

router.get("/dashboard-data", protect, getDashboardData);

router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/", protect, getTasks);
router.get("/:id", protect, getTaskById);
router.post("/", protect, adminOrCeo, createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, adminOrCeo, deleteTask);
router.put("/:id/status", protect, updateTaskStatus);
router.put("/:id/todo", protect, updateTaskChecklist);
router.put("/:id/todos", protect, updateTaskChecklist);

module.exports = router;
