// backend/routes/aiRoutes.js
const express = require('express');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { generateOrgHealthReport } = require('../controllers/aiController');

const router = express.Router();

// Pillar 1: CEO AI Organizational Health Diagnostic Route
// Protected route: Only authenticated admins/CEOs can access this
router.get("/org-health", protect, adminOnly, generateOrgHealthReport);

module.exports = router;
