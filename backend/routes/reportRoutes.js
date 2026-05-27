const express = require("express");
const { adminOrCeo, protect } = require("../middlewares/authMiddleware");
const {exportTasksReport, exportUsersReport} = require("../controllers/reportController")


const router = express.Router();



router.get("/export/tasks", protect, adminOrCeo, exportTasksReport);
router.get("/export/users", protect, adminOrCeo, exportUsersReport);

module.exports = router;