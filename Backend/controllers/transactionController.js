const pool = require('../config/db');

// @desc    Deposit money into account
// @route   POST /api/transactions/deposit
// @access  Private
const depositMoney = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        if (amount <= 0) {
            res.status(400);
            return next(new Error('Amount must be greater than zero'));
        }

        await connection.beginTransaction();

        // Lock row for update based on user_id
        const [accounts] = await connection.query(
            'SELECT * FROM accounts WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (accounts.length === 0) {
            res.status(404);
            return next(new Error('Account not found'));
        }

        const accountId = accounts[0].id;
        const newBalance = parseFloat(accounts[0].balance) + parseFloat(amount);

        // Update balance
        await connection.query(
            'UPDATE accounts SET balance = ? WHERE id = ?',
            [newBalance, accountId]
        );

        // Record transaction
        const [transaction] = await connection.query(
            'INSERT INTO transactions (account_id, type, amount) VALUES (?, ?, ?)',
            [accountId, 'DEPOSIT', amount]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            data: {
                transactionId: transaction.insertId,
                accountId,
                amount,
                type: 'DEPOSIT',
                newBalance
            }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Withdraw money from account
// @route   POST /api/transactions/withdraw
// @access  Private
const withdrawMoney = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        if (amount <= 0) {
            res.status(400);
            return next(new Error('Amount must be greater than zero'));
        }

        await connection.beginTransaction();

        const [accounts] = await connection.query(
            'SELECT * FROM accounts WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (accounts.length === 0) {
            res.status(404);
            return next(new Error('Account not found'));
        }

        const accountId = accounts[0].id;
        const currentBalance = parseFloat(accounts[0].balance);
        const withdrawalAmount = parseFloat(amount);

        if (currentBalance < withdrawalAmount) {
            res.status(400);
            return next(new Error('Insufficient funds'));
        }

        const newBalance = currentBalance - withdrawalAmount;

        // Update balance
        await connection.query(
            'UPDATE accounts SET balance = ? WHERE id = ?',
            [newBalance, accountId]
        );

        // Record transaction
        const [transaction] = await connection.query(
            'INSERT INTO transactions (account_id, type, amount) VALUES (?, ?, ?)',
            [accountId, 'WITHDRAWAL', amount]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            data: {
                transactionId: transaction.insertId,
                accountId,
                amount,
                type: 'WITHDRAWAL',
                newBalance
            }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Get transaction history
// @route   GET /api/transactions/history
// @access  Private
const getTransactionHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [accounts] = await pool.query(
            'SELECT id FROM accounts WHERE user_id = ?',
            [userId]
        );

        if (accounts.length === 0) {
            res.status(404);
            return next(new Error('Account not found'));
        }

        const accountId = accounts[0].id;

        const [transactions] = await pool.query(
            'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC',
            [accountId]
        );

        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { depositMoney, withdrawMoney, getTransactionHistory };
