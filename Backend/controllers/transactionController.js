const TransactionService = require('../services/transactionService');

// @desc    Deposit money into account
// @route   POST /api/transactions/deposit
// @access  Private
const depositMoney = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const idempotencyKey = req.headers['x-idempotency-key'] || `dep-legacy-${Date.now()}`; // fallback for old frontend testing if missing

        if (amount <= 0) {
            res.status(400);
            return next(new Error('Amount must be greater than zero'));
        }

        const result = await TransactionService.depositMoney(req.user.id, amount, idempotencyKey);

        res.status(200).json({
            success: true,
            data: {
                transactionId: result.transactionId,
                accountId: result.accountId,
                amount: parseFloat(result.amount),
                type: 'DEPOSIT',
                newBalance: result.newBalance,
                status: result.status,
                cached: result.cached || false
            }
        });
    } catch (error) {
        if (error.message === 'HEADER_MISSING_IDEMPOTENCY') {
            return res.status(400).json({ success: false, message: 'Missing x-idempotency-key header' });
        }
        next(error);
    }
};

// @desc    Withdraw money from account
// @route   POST /api/transactions/withdraw
// @access  Private
const withdrawMoney = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const idempotencyKey = req.headers['x-idempotency-key'] || `with-legacy-${Date.now()}`;

        if (amount <= 0) {
            res.status(400);
            return next(new Error('Amount must be greater than zero'));
        }

        const result = await TransactionService.withdrawMoney(req.user.id, amount, idempotencyKey);

        res.status(200).json({
            success: true,
            data: {
                transactionId: result.transactionId,
                amount: parseFloat(result.amount),
                type: 'WITHDRAWAL',
                newBalance: result.newBalance,
                status: result.status,
                cached: result.cached || false
            }
        });
    } catch (error) {
        if (error.message === 'Insufficient funds') {
            return res.status(400).json({ success: false, message: 'Insufficient funds' });
        }
        if (error.message === 'HEADER_MISSING_IDEMPOTENCY') {
            return res.status(400).json({ success: false, message: 'Missing x-idempotency-key header' });
        }
        next(error);
    }
};

// @desc    Transfer money between users
// @route   POST /api/transactions/transfer
// @access  Private
const transferMoney = async (req, res, next) => {
    try {
        const { receiverAccountId, amount } = req.body;
        const idempotencyKey = req.headers['x-idempotency-key'] || `trans-legacy-${Date.now()}`;

        if (!receiverAccountId || amount <= 0) {
            res.status(400);
            return next(new Error('Invalid receiver account ID or amount'));
        }

        const result = await TransactionService.transferMoney(req.user.id, receiverAccountId, amount, idempotencyKey);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        if (error.message === 'Insufficient funds' || error.message === 'Receiver account invalid' || error.message === 'Cannot transfer to same account') {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === 'HEADER_MISSING_IDEMPOTENCY') {
            return res.status(400).json({ success: false, message: 'Missing x-idempotency-key header' });
        }
        next(error);
    }
};

// @desc    Get transaction history
// @route   GET /api/transactions/history
// @access  Private
const getTransactionHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, type } = req.query;
        // In a real JPMC production app, limit and offset are pushed out to TransactionService
        // But since we rely on the `getHistory` returning top 100 for now, we will add support inside the service 
        // Or for now simply keep existing getHistory compatible
        const transactions = await TransactionService.getHistory(req.user.id);

        // Simple manual filter for now if query type requested
        let filtered = transactions;
        if (type) filtered = transactions.filter(t => t.type === type.toUpperCase());

        res.json({
            success: true,
            count: filtered.length,
            data: transactions
            // JPMC note: if true pagination supported, push { page, limit, count } 
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { depositMoney, withdrawMoney, transferMoney, getTransactionHistory };
