const express = require('express');
const router = express.Router();
const {
  generateOrgHealthReport,
  recommendAssignees,
  getCognitiveLoadAnalysis,
  executeNLQuery,
  streamNLAnswer
} = require('../controllers/aiController');
const { decodeTaskBriefing } = require('../controllers/taskCompassController');
const { protect, adminOrCeo, ceoOnly } = require('../middlewares/authMiddleware');

router.get('/org-health', protect, adminOrCeo, generateOrgHealthReport);


router.post('/recommend-assignees', protect, adminOrCeo, recommendAssignees);
router.get('/cognitive-load/:userId', protect, adminOrCeo, getCognitiveLoadAnalysis);


router.post('/tasks/:taskId/decode', protect, decodeTaskBriefing);

router.post('/ceo/nl-query', protect, ceoOnly, executeNLQuery);
router.post('/ceo/nl-query/stream', protect, ceoOnly, streamNLAnswer);

module.exports = router;

