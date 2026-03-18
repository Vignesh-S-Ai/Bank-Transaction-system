const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

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

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;

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

        res.json({
            success: true,
            token: generateToken(user.id),
            data: { id: user.id, username: user.username, full_name: user.full_name }
        });
    } catch (error) {
        next(error);
    }
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = { registerUser, loginUser };
