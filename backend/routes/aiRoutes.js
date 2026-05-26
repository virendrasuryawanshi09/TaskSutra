// backend/routes/aiRoutes.js
const express = require('express');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { 
    generateOrgHealthReport, 
    simulateExecution, 
    analyzeTeamChemistry, 
    matchTaskDna 
} = require('../controllers/aiController');

const router = express.Router();

// Pillar 1: CEO AI Organizational Health Diagnostic Route
router.get("/org-health", protect, adminOnly, generateOrgHealthReport);

// Pillar 2: Admin AI Execution Simulator
router.post("/simulate", protect, adminOnly, simulateExecution);

// Pillar 3: Admin AI Team Chemistry Engine
router.post("/chemistry", protect, adminOnly, analyzeTeamChemistry);

// Pillar 4: Member AI Work Personality & Task DNA Engine
router.get("/task-dna/:taskId", protect, matchTaskDna);

module.exports = router;
