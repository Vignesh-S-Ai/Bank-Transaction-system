require('dotenv').config();
const axios = require('axios');

// ─── KEY VALIDATION ────────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY?.trim();

if (!GEMINI_KEY) console.error('❌ FATAL: GEMINI_API_KEY NOT SET');

// Current Gemini Alias (March 2026)
const MODEL_NAME = "gemini-3-flash-preview";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_KEY}`;

// ─── ChatGPT-level System Prompt ──────────────────────────────────────────
function buildPrompt(message, history = [], context = {}) {
    const { balance = 0, monthlyIncome = 3000, monthlySpend = 1200, transactions = [] } = context;

    const systemBlock = `You are Nova, a highly intelligent, proactive financial co-pilot.
Your goal is to provide ChatGPT-level insights. You are non-robotic, advisory, and deeply context-aware.

Context Snapshot:
- Balance: $${balance}
- Monthly Income: $${monthlyIncome}
- Monthly Spending: $${monthlySpend}
- Savings Rate: ${((monthlyIncome - monthlySpend) / monthlyIncome * 100).toFixed(1)}%

Personality Rules:
1. USE NATURAL VARYING TONES: Instead of "Balance is 9000," say "You're in a strong position with $9,000 available."
2. BE ADVISORY: If a spend is large, explain the trade-offs (e.g., impact on savings goals).
3. CONCISE BUT HELPFUL: Markdown lists and bold text are preferred.
4. MEMORY: You have the last 10 messages of the convo. Refer to previous context if relevant.

Current Transactions: ${JSON.stringify(transactions.slice(0, 5))}

--- History (Last 10 turns):`;

    let historyBlock = '';
    if (history.length > 0) {
        history.slice(-10).forEach(m => {
            const role = m.role === 'user' ? 'User' : 'Nova';
            historyBlock += `\n${role}: ${m.text}`;
        });
    }

    return `${systemBlock}${historyBlock}\nUser: ${message}\nNova:`;
}

// ... your buildPrompt function remains the same ...

class LLMService {
    async generateResponse(message, history = [], context = {}, retries = 3) {
        if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY is missing.');

        const prompt = buildPrompt(message, history, context);

        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.post(
                    GEMINI_URL,
                    {
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.85,
                            maxOutputTokens: 800,
                            topP: 0.95
                        }
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 60000 // Increased to 60s
                    }
                );

                const replyText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!replyText) throw new Error('Empty response from Gemini');
                return replyText.trim();

            } catch (err) {
                const isRateLimit = err.response?.status === 429;
                const isServerOverload = err.response?.status === 503;

                if ((isRateLimit || isServerOverload) && i < retries - 1) {
                    console.warn(`⚠️ [Gemini] Attempt ${i + 1} failed (${err.message}). Retrying...`);
                    // Wait 2 seconds before retrying
                    await new Promise(res => setTimeout(res, 2000));
                    continue;
                }

                console.error(`🔴 [Gemini] Final Error — ${err.message}`);
                throw new Error('Nova AI is temporarily unavailable. Please try again later.');
            }
        }
    }
}
module.exports = new LLMService();