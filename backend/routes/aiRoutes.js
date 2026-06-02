const express = require('express');
const router = express.Router();
const { 
  generateOrgHealthReport, 
  recommendAssignees, 
  getCognitiveLoadAnalysis,
  executeNLQuery,
  streamNLAnswer
} = require('../controllers/aiController');
const { protect, adminOrCeo, ceoOnly } = require('../middlewares/authMiddleware');

// Route for CEO Org Health Diagnostic (restricted to Admins/CEOs)
router.get('/org-health', protect, adminOrCeo, generateOrgHealthReport);

// Route for Team Allocator recommendations
router.post('/recommend-assignees', protect, adminOrCeo, recommendAssignees);

// Route for Cognitive Load & Delivery Probability Analysis
router.get('/cognitive-load/:userId', protect, adminOrCeo, getCognitiveLoadAnalysis);

// CEO-only Natural Language Query Engine routes
router.post('/ceo/nl-query', protect, ceoOnly, executeNLQuery);
router.post('/ceo/nl-query/stream', protect, ceoOnly, streamNLAnswer);

module.exports = router;

