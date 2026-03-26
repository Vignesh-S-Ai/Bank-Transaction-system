// NLP Engine: Intent & Entity Extraction

export const Intents = {
    TRANSFER: 'TRANSFER',
    CHECK_BALANCE: 'CHECK_BALANCE',
    ANALYZE_SPEND: 'ANALYZE_SPEND',
    CAN_I_SPEND: 'CAN_I_SPEND',
    SET_GOAL: 'SET_GOAL',
    FINANCIAL_HEALTH: 'FINANCIAL_HEALTH',
    PREDICT_FUTURE: 'PREDICT_FUTURE',
    SHOW_CHART: 'SHOW_CHART',
    ASK_ADVICE: 'ASK_ADVICE',
    GREETING: 'GREETING',
    SUPPORT: 'SUPPORT',
    UNKNOWN: 'UNKNOWN'
};

const keywords = {
    [Intents.TRANSFER]: ['transfer', 'send', 'pay', 'remit', 'wire'],
    [Intents.CHECK_BALANCE]: ['balance', 'how much money', 'my account', 'funds available', 'total'],
    [Intents.ANALYZE_SPEND]: ['spent', 'spending', 'expenses', 'outgoings', 'audit', 'breakdown'],
    [Intents.CAN_I_SPEND]: ['can i spend', 'can i afford', 'should i buy', 'safe to spend', 'ok to buy'],
    [Intents.SET_GOAL]: ['set goal', 'savings target', 'save goal', 'target to'],
    [Intents.FINANCIAL_HEALTH]: ['health', 'score', 'doing financially', 'status'],
    [Intents.PREDICT_FUTURE]: ['predict', 'future', 'next week', 'forecast', 'projection'],
    [Intents.SHOW_CHART]: ['chart', 'graph', 'visual', 'plot', 'visualize'],
    [Intents.ASK_ADVICE]: ['advice', 'recommend', 'suggest', 'tips', 'guide', 'help with money'],
    [Intents.GREETING]: ['hello', 'hi', 'hey', 'morning', 'afternoon', 'evening', 'sup', 'yo'],
    [Intents.SUPPORT]: ['help', 'support', 'contact', 'broken', 'issue', 'problem']
};

export const extractEntities = (text) => {
    const t = text.toLowerCase();
    const entities = {};

    // 1. Amount Extraction
    const amountMatch = t.match(/\$?\b(\d+(\.\d{1,2})?)\b/);
    if (amountMatch) entities.amount = parseFloat(amountMatch[1]);

    // 2. Recipient/Account Extraction
    const accountMatch = t.match(/(?:to|account)\s+([a-zA-Z0-9]+)/);
    if (accountMatch && !['account', 'my', 'the', 'a'].includes(accountMatch[1])) {
        entities.recipient = accountMatch[1];
    }

    // 3. Category Extraction (Matching common bank categories)
    const knownCategories = ['food', 'rent', 'utilities', 'shopping', 'entertainment', 'travel', 'health'];
    const catMatch = knownCategories.find(c => t.includes(c));
    if (catMatch) entities.category = catMatch;

    return entities;
};

export const detectIntent = (text) => {
    const t = text.toLowerCase();
    let results = [];

    for (const [intent, words] of Object.entries(keywords)) {
        let score = 0;
        words.forEach(w => {
            if (t.includes(w)) score += 1;
            if (new RegExp(`\\b${w}\\b`).test(t)) score += 2; // Bonus for whole word match
        });

        if (score > 0) {
            results.push({ intent, score });
        }
    }

    if (results.length === 0) return { intent: Intents.UNKNOWN, confidence: 0 };

    results.sort((a, b) => b.score - a.score);
    const top = results[0];

    // Simple confidence calculation
    const totalScore = results.reduce((s, r) => s + r.score, 0);
    const confidence = top.score / (totalScore || 1);

    return { intent: top.intent, confidence };
};

export const processInput = (text) => {
    return {
        originalText: text,
        intent: detectIntent(text),
        entities: extractEntities(text)
    };
};
