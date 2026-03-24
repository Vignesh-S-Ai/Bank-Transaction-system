const llmService = require('../services/llmService');

const generateAiChat = async (req, res, next) => {
    try {
        const { message, history = [], context = {} } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const reply = await llmService.generateResponse(message, history, context);
        res.json({ reply });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateAiChat
};
