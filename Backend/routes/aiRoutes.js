const express = require('express');
const { generateAiChat, testAiConnection } = require('../controllers/aiController');

const router = express.Router();

// Main AI chat endpoint
// POST /api/ai/chat  { message, history, context }
router.post('/chat', generateAiChat);

// Test endpoint — verify LLM is reachable without the frontend
// GET /api/ai/test
router.get('/test', testAiConnection);

module.exports = router;
