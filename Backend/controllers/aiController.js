const llmService = require('../services/llmService');
const aiSimulator = require('../services/aiLogic');
const { IntentService, Intents } = require('../services/intentService');

// Initialize Intent Engine
const intentEngine = new IntentService();

/**
 * Nova AI — Hybrid Intelligence Controller
 * Layer 1: Local Simulation & Calculation (Fast)
 * Layer 2: Gemini LLM for reasoning and advice (Cloud)
 */
const generateAiChat = async (req, res) => {
    const { message, history = [], context = {} } = req.body;
    const { balance = 0, monthlyIncome = 3000, monthlySpend = 1200, savingsGoal = 5000 } = context;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ success: false, message: '"message" is required.' });
    }

    try {
        const query = message.trim();
        const { intent, confidence, entities } = intentEngine.detect(query);

        console.log(`🧠 [Nova AI] Intent: ${intent} (Conf: ${confidence.toFixed(2)})`);

        // ─── LAYER 1: FAST LOCAL PROCESSING ───────────────────────────────────

        // Scenario Simulation (e.g., "What if I spend 5000?")
        if (intent === Intents.SIMULATION && entities.amount) {
            const simulation = aiSimulator.simulateImpact(balance, entities.amount, entities.type, { monthlyIncome, monthlySpend, savingsGoal });

            // Add advisory layer via LLM if it's a "why" or "how" question
            if (query.includes('why') || query.includes('how')) {
                const llmReply = await llmService.generateResponse(
                    `The user wants to know about the impact of spending ${entities.amount}. 
                     Simulation result: Balance ${simulation.newBalance}, Score ${simulation.score}. 
                     Explain why this happens concisely and non-robotically.`,
                    history,
                    context
                );
                return res.status(200).json({ success: true, reply: llmReply });
            }

            return res.status(200).json({ success: true, reply: simulation.advice });
        }

        // Quick Balance Check
        if (intent === Intents.CHECK_BALANCE && confidence > 0.8) {
            const toneVariation = [
                `You're in a strong position with a balance of **$${balance.toLocaleString()}**.`,
                `Your current balance is **$${balance.toLocaleString()}**. Looking good!`,
                `You currently have **$${balance.toLocaleString()}** available in your account.`
            ];
            const reply = toneVariation[Math.floor(Math.random() * toneVariation.length)];
            return res.status(200).json({ success: true, reply });
        }

        // ─── LAYER 2: DEEP CLOUD REASONING (Gemini) ──────────────────────────

        const reply = await llmService.generateResponse(query, history, context);
        return res.status(200).json({ success: true, reply });

    } catch (error) {
        console.error('🔴 [aiController] generateAiChat error:', error.message);
        return res.status(503).json({
            success: false,
            message: error.message || 'Nova AI is temporarily unavailable. Please try again.'
        });
    }
};

const testAiConnection = async (req, res) => {
    try {
        const reply = await llmService.generateResponse('Nova AI online ✅', [], { balance: 0, transactions: [] });
        return res.status(200).json({ success: true, status: 'ok', reply });
    } catch (error) {
        return res.status(503).json({ success: false, status: 'error', message: error.message });
    }
};

module.exports = { generateAiChat, testAiConnection };
