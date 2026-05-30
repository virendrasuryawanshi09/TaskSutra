const express = require('express');
const router = express.Router();
const { generateOrgHealthReport, generateTaskBreakdown } = require('../controllers/aiController');
const { protect, adminOrCeo } = require('../middlewares/authMiddleware');

// Route for CEO Org Health Diagnostic (restricted to Admins/CEOs)
router.get('/org-health', protect, adminOrCeo, generateOrgHealthReport);

// Route for Admin Smart Task Checklist Breakdown & Time Estimation
router.post('/breakdown', protect, adminOrCeo, generateTaskBreakdown);

module.exports = router;

