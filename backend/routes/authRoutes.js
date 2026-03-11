const express = require('express');

const router = express.Router();

//Auth Routes

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post("/profile", protect, getUserProfile);
router.post("/profile", protect, updateUserProfile);

module.exports = router;