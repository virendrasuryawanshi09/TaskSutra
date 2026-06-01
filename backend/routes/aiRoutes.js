const express = require('express');
const router = express.Router();
const { generateOrgHealthReport } = require('../controllers/aiController');
const { protect, adminOrCeo } = require('../middlewares/authMiddleware');

// Route for CEO Org Health Diagnostic (restricted to Admins/CEOs)
router.get('/org-health', protect, adminOrCeo, generateOrgHealthReport);

module.exports = router;

