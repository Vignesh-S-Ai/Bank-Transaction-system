const pool = require('../config/db');

// @desc    Create an account for user
// @route   POST /api/accounts
// @access  Private
const createAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const initialBalance = req.body.initialBalance || 0;

        // Check if account already exists
        const [existing] = await pool.query('SELECT * FROM accounts WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Account already exists for this user' });
        }

        const [result] = await pool.query(
            'INSERT INTO accounts (user_id, balance) VALUES (?, ?)',
            [userId, initialBalance]
        );

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                user_id: userId,
                balance: initialBalance
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get account balance for logged in user
// @route   GET /api/accounts/me
// @access  Private
const getAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [accounts] = await pool.query(
            'SELECT * FROM accounts WHERE user_id = ?',
            [userId]
        );

        if (accounts.length === 0) {
            // Auto-create an account if none exists
            const [result] = await pool.query('INSERT INTO accounts (user_id, balance) VALUES (?, ?)', [userId, 0]);
            return res.status(201).json({
                success: true,
                data: { id: result.insertId, user_id: userId, balance: 0 }
            });
        }

        res.json({
            success: true,
            data: accounts[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createAccount, getAccount };
