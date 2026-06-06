const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { upload, uploadToCloudinary } = require('../middlewares/uploadMiddleware');
const { validateBody, registerSchema, loginSchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per 15 minutes
    message: { message: "Too many authentication attempts, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});

//Auth Routes

router.post('/register', authLimiter, validateBody(registerSchema), registerUser);
router.post('/login', authLimiter, validateBody(loginSchema), loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteAccount);

router.post("/upload-image", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    try {
        const result = await uploadToCloudinary(req.file);
        res.status(200).json({ imageUrl: result.secure_url });
    } catch (error) {
        res.status(500).json({ message: "Cloudinary upload failed", error: error.message });
    }
});

module.exports = router;
