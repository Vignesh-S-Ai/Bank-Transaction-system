/**
 * Nova AI — Intent Detection & Entity Extraction
 * Uses regex patterns to identify user goals and extract financial entities.
 */

const Intents = {
    SIMULATION: 'SIMULATION',
    CHECK_BALANCE: 'CHECK_BALANCE',
    GREETING: 'GREETING',
    ADVICE: 'ADVICE',
    TRANSFER: 'TRANSFER',
    UNKNOWN: 'UNKNOWN'
};

class IntentService {
    detect(text) {
        const t = text.toLowerCase();

        // 1. Simulation Detection (e.g., "if I spend 500", "what happens if I withdraw 200")
        const simPattern = /(?:if|what happens if|suppose|assume)\s+(?:i\s+)?(?:spend|withdraw|buy|deposit|add|transfer|send)\s+(?:\$)?(\d+(?:\.\d{1,2})?)/i;
        const simMatch = t.match(simPattern);
        if (simMatch) {
            return {
                intent: Intents.SIMULATION,
                confidence: 0.95,
                entities: {
                    amount: parseFloat(simMatch[1]),
                    type: t.includes('deposit') || t.includes('add') ? 'DEPOSIT' : 'SPEND'
                }
            };
        }

        // 2. Balance Detection
        if (/\b(balance|how much|funds|money)\b/i.test(t)) {
            return { intent: Intents.CHECK_BALANCE, confidence: 0.9 };
        }

        // 3. Greetings
        if (/\b(hi|hello|hey|how are you|morning|evening|sup)\b/i.test(t)) {
            return { intent: Intents.GREETING, confidence: 0.85 };
        }

        // 4. Transfer
        if (/\b(transfer|send|pay)\b/i.test(t)) {
            const amountMatch = t.match(/(?:\$)?(\d+(?:\.\d{1,2})?)/);
            return {
                intent: Intents.TRANSFER,
                confidence: 0.8,
                entities: { amount: amountMatch ? parseFloat(amountMatch[1]) : null }
            };
        }

        // 5. Advice
        if (/\b(advice|suggest|recommend|help|tips)\b/i.test(t)) {
            return { intent: Intents.ADVICE, confidence: 0.75 };
        }

        return { intent: Intents.UNKNOWN, confidence: 0.1 };
    }
}

module.exports = { IntentService, Intents };
