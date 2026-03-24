const express = require('express');
const { generateAiChat } = require('../controllers/aiController');

const router = express.Router();

router.post('/chat', generateAiChat);

module.exports = router;
