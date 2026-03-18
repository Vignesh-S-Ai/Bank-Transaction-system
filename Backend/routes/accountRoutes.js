const express = require('express');
const router = express.Router();
const { createAccount, getAccount } = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createAccount);
router.get('/me', protect, getAccount);

module.exports = router;
