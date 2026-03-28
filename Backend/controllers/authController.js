const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const behaviorService = require('../services/behaviorService');
const continuousAuthService = require('../services/continuousAuthService');
const otpService = require('../services/otpService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { username, password, full_name } = req.body;

        if (!username || !password || !full_name) {
            res.status(400);
            throw new Error('Please add all fields');
        }

        // Check if user exists
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length > 0) {
            res.status(400);
            throw new Error('User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await pool.query(
            'INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)',
            [username, hashedPassword, full_name]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId, username, full_name }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate a user with behavioral verification
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { username, password, behavioralData = {} } = req.body;

        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        // ─── BEHAVIORAL ANALYSIS STAGE ───

        // 1. Validate & Sanitize Incoming Telemetry
        const { typingSpeed = 0, mouseVelocity = 0, sampleSize = 0 } = behavioralData;
        const currentBehavior = {
            typingSpeed: Math.max(0, Number(typingSpeed) || 0),
            mouseVelocity: Math.max(0, Number(mouseVelocity) || 0),
            sampleSize: Math.max(0, Number(sampleSize) || 0),
            loginTime: new Date().getHours(),
            deviceInfo: req.get('user-agent') || 'unknown'
        };

        // 2. Risk Calculation (Local Engine)
        let riskScore = await behaviorService.calculateRisk(user.id, currentBehavior);

        // 3. AI Behavior Analysis Overlay (Cloud Pattern Recognition)
        // If local engine detects slight anomalies but not enough to trigger MFA, we ask AI to analyze.
        if (riskScore >= 40 && riskScore < 70) {
            riskScore = await behaviorService.analyzeWithAi(user.id, currentBehavior, riskScore);
        }

        // 4. Handle Suspicious Activity (Adaptive 2FA)
        if (riskScore >= 40) {
            console.warn(`🛑 [ALERT] Suspicious login for ${username}. Risk Score: ${riskScore}. Triggering OTP.`);

            // Generate and send 6-digit code via simulated email/SMS
            await otpService.generateAndSendOTP(user.id, user.username);

            // Create a short-lived temporary token solely for identifying the user during OTP step
            const tempToken = jwt.sign({ id: user.id, isTemp: true }, process.env.JWT_SECRET, { expiresIn: '10m' });

            return res.status(200).json({
                success: false,
                verification_required: true,
                tempToken: tempToken,
                risk_score: riskScore,
                message: 'Unusual behavior detected. Please verify your identity with the code sent to your email.'
            });
        }

        // 5. Profiling Update Rules
        // Rule A: Do not learn from high-risk logins
        // Rule B: Do not learn from auto-fill (sampleSize < 3 keystrokes usually implies pasting/autofill)
        if (riskScore < 30 && currentBehavior.sampleSize >= 3) {
            await behaviorService.updateProfile(user.id, currentBehavior);
        } else if (currentBehavior.sampleSize < 3) {
            console.log(`ℹ️ [Behavior Auth] Ignored profile update for ${username} (Auto-fill suspected)`);
        }

        res.json({
            success: true,
            token: generateToken(user.id),
            risk_score: riskScore,
            data: { id: user.id, username: user.username, full_name: user.full_name }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Calculate risk of ongoing session
// @route   POST /api/auth/telemetry
// @access  Private
const processTelemetry = async (req, res, next) => {
    try {
        const result = await continuousAuthService.analyzeTelemetry(req.user.id, req.body);

        // If session is deemed compromised, force a frontend logout
        if (result.status === 'compromised') {
            return res.status(401).json({
                success: false,
                force_logout: true,
                message: 'Security anomaly detected. Session terminated.'
            });
        }

        res.status(200).json({ success: true, risk_score: result.riskScore });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP for Adaptive 2FA
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
    try {
        console.log('--- ENTERING /verify-otp ---');
        const { tempToken, otp } = req.body;
        console.log('Received OTP from client:', otp);

        if (!tempToken || !otp) {
            console.error('Missing tempToken or otp');
            res.status(400);
            throw new Error('Missing token or OTP');
        }

        // Verify temp token
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
            if (!decoded.isTemp) {
                console.error('Token is not marked as isTemp');
                throw new Error('Invalid token type');
            }
            console.log('TempToken verified. User ID:', decoded.id);
        } catch (err) {
            console.error('JWT Verification failed:', err.message);
            res.status(401);
            throw new Error('Session expired or invalid token');
        }

        // Validate OTP against database
        console.log('Calling otpService.verifyOTP...');
        const isValid = await otpService.verifyOTP(decoded.id, otp);
        console.log('Result of verifyOTP =', isValid);

        if (!isValid) {
            console.error('OTP validation returned false. Rejecting logic.');
            res.status(400);
            throw new Error('Invalid or expired verification code');
        }

        // Success - Get full user data
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) {
            console.error('User not found in verifyOtp');
            res.status(404);
            throw new Error('User not found');
        }

        const user = users[0];
        console.log('OTP Verified Successfully! Issuing permanent token for User:', user.username);

        res.json({
            success: true,
            token: generateToken(user.id),
            data: { id: user.id, username: user.username, full_name: user.full_name },
            message: 'Identity verified successfully.'
        });

    } catch (error) {
        console.error('🔴 ERROR IN /verify-otp:', error.message);
        next(error);
    }
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = { registerUser, loginUser, processTelemetry, verifyOtp };

