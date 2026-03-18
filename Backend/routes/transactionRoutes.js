const express = require('express');
const router = express.Router();
const { depositMoney, withdrawMoney, getTransactionHistory } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/deposit', protect, depositMoney);
router.post('/withdraw', protect, withdrawMoney);
router.get('/history', protect, getTransactionHistory);

module.exports = router;
