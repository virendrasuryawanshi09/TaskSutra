const express = require('express');
const {protect, adminOrCeo} = require('../middlewares/authMiddleware');
const { updateTaskStatus, getTasks, getTaskById, createTask, updateTask, deleteTask, updateTaskChecklist} = require('../controllers/taskController');
const { getDashboardData, getUserDashboardData } = require('../controllers/dashboardController');
const validateObjectId = require('../middlewares/validateObjectId');
const { validateBody, taskStatusUpdateSchema, taskChecklistUpdateSchema } = require('../middlewares/validationMiddleware');
const { checkIdempotency } = require('../middlewares/idempotencyMiddleware');

const router = express.Router();

router.get("/dashboard-data", protect, getDashboardData);

router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/", protect, getTasks);
router.get("/:id", protect, validateObjectId, getTaskById);
router.post("/", protect, adminOrCeo, createTask);
router.put("/:id", protect, validateObjectId, updateTask);
router.delete("/:id", protect, adminOrCeo, validateObjectId, deleteTask);
router.put("/:id/status", protect, validateObjectId, checkIdempotency, validateBody(taskStatusUpdateSchema), updateTaskStatus);
router.put("/:id/todo", protect, validateObjectId, checkIdempotency, validateBody(taskChecklistUpdateSchema), updateTaskChecklist);
router.put("/:id/todos", protect, validateObjectId, checkIdempotency, validateBody(taskChecklistUpdateSchema), updateTaskChecklist);

module.exports = router;
