const axios = require('axios');

/**
 * LLMService handles AI responses using either OpenAI or Gemini APIs.
 * It prioritizes Gemini for its free tier and falls back to OpenAI if configured.
 */
class LLMService {
    async generateResponse(message, history = [], context = {}) {
        // Sanitize API keys (remove quotes/spaces)
        const openAiKey = process.env.OPENAI_API_KEY?.replace(/["']/g, '').trim();
        const geminiKey = process.env.GEMINI_API_KEY?.replace(/["']/g, '').trim();

        if (!openAiKey && !geminiKey) {
            console.error("❌ Configuration Error: No AI API keys found in .env");
            throw new Error("Missing AI configuration on server.");
        }

        const safeBalance = context?.balance || 0;
        const safeTransactions = Array.isArray(context?.transactions) ? context.transactions : [];

        // Build the core system prompt with real financial context
        const systemMessageText = `You are Nova, an intelligent fintech AI assistant for NovaBank.
Act as a predictive financial co-pilot. Be conversational, professional, and helpful.
Use Markdown formatting for emphasis.

User Financial Context:
- Available Balance: $${safeBalance}
- Recent Activity: ${JSON.stringify(safeTransactions.slice(0, 5))}

Instructions:
1. Provide intelligent insights based on the context.
2. If spending is high, suggest budget limits.
3. Keep responses under 80 words.
4. If asked to perform an action (like transfer), advise that you've triggered the secure workflow.`;

        // 🟢 ATTEMPT 1: GOOGLE GEMINI (Prioritized)
        if (geminiKey) {
            try {
                // Formatting for Gemini contents structure
                // We join history into a plain text prompt for the models that prefer single-shot or text blocks
                let historyPrompt = "";
                history.forEach(m => {
                    if (m.text) historyPrompt += `${m.role === 'user' ? 'User' : 'Nova'}: ${m.text}\n`;
                });

                const fullPrompt = `${systemMessageText}\n\nChat History:\n${historyPrompt}\nUser: ${message}\n\nNova:`;

                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

                const response = await axios.post(geminiUrl, {
                    contents: [{
                        parts: [{ text: fullPrompt }]
                    }]
                });

                const replyText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (replyText) {
                    console.log("💎 Gemini Response Received Successfully");
                    return replyText;
                }

                throw new Error("Empty response from Gemini");
            } catch (error) {
                const errorData = error?.response?.data;
                console.error("🔴 Gemini API Error:", errorData || error.message);

                // If OpenAI is not available, we have to fail here
                if (!openAiKey) {
                    throw new Error(`AI Service Unavailable: ${errorData?.error?.message || error.message}`);
                }
                console.log("🔄 Falling back to OpenAI...");
            }
        }

        // 🟠 ATTEMPT 2: OPENAI (Fallback)
        try {
            const messages = [
                { role: "system", content: systemMessageText },
                ...history.map(m => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    content: m.text || ""
                })),
                { role: "user", content: message }
            ];

            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 256
                },
                {
                    headers: {
                        'Authorization': `Bearer ${openAiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log("🤖 OpenAI Response Received Successfully");
            return response.data.choices[0].message.content;
        } catch (error) {
            const errorData = error?.response?.data;
            console.error("🔴 OpenAI API Error:", errorData || error.message);

            // Check for specific quota error to provide better feedback
            if (errorData?.error?.code === 'insufficient_quota') {
                throw new Error("AI engine quota exceeded. Please use Gemini or check billing.");
            }

            throw new Error("AI service is currently offline. Please try again later.");
        }
    }
}

module.exports = new LLMService();
