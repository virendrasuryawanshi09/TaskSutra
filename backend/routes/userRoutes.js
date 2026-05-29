const express = require("express");
const { adminOnly, protect } = require("../middlewares/authMiddleware");
const { getUsers, getUserById, reorderTasks } = require("../controllers/userController");
const validateObjectId = require("../middlewares/validateObjectId");

const router = express.Router();

router.get("/", protect, getUsers);
router.put("/reorder-tasks", protect, reorderTasks);
router.get("/:id", protect, validateObjectId, getUserById);

module.exports = router;