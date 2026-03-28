const express = require('express');
const router = express.Router();
const { registerUser, loginUser, processTelemetry, verifyOtp } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);

// Continuous Post-Login Authentication Telemetry
router.post('/telemetry', protect, processTelemetry);

module.exports = router;
