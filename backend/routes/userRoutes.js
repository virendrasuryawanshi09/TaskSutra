const express = require("express");
const { adminOnly, protect} = require("../middleware/roleMiddleware");
const {getUsers, getUserById} = require("../controllers/userController");

const router = express.Router();


router.get("/", protect, adminOnly, getUsers);
router.get("/:id", protect, getUserById);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;