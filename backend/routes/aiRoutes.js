const express = require('express');
const router = express.Router();
const { generateOrgHealthReport, recommendAssignees } = require('../controllers/aiController');
const { protect, adminOrCeo } = require('../middlewares/authMiddleware');

// Route for CEO Org Health Diagnostic (restricted to Admins/CEOs)
router.get('/org-health', protect, adminOrCeo, generateOrgHealthReport);

// Route for Team Allocator recommendations
router.post('/recommend-assignees', protect, adminOrCeo, recommendAssignees);

module.exports = router;

