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
    UNKNOWN: 'UNKNOWN'
};

const keywords = {
    [Intents.TRANSFER]: ['transfer', 'send', 'pay', 'remit'],
    [Intents.CHECK_BALANCE]: ['balance', 'how much money', 'my account', 'funds available'],
    [Intents.ANALYZE_SPEND]: ['spent', 'spending', 'expenses', 'outgoings'],
    [Intents.CAN_I_SPEND]: ['can i spend', 'can i afford', 'should i buy', 'safe to spend'],
    [Intents.SET_GOAL]: ['set goal', 'savings target', 'save goal', 'goal to'],
    [Intents.FINANCIAL_HEALTH]: ['health', 'score', 'doing financially', 'risk'],
    [Intents.PREDICT_FUTURE]: ['predict', 'future', 'next week', 'forecast'],
    [Intents.SHOW_CHART]: ['chart', 'graph', 'visual', 'plot'],
    [Intents.ASK_ADVICE]: ['advice', 'recommend', 'suggest', 'tips'],
    [Intents.GREETING]: ['hello', 'hi', 'hey', 'morning', 'afternoon', 'evening']
};

export const extractEntities = (text) => {
    const t = text.toLowerCase();
    const entities = {};

    // 1. Amount Extraction (e.g. 500, $500, 50.25)
    const amountMatch = t.match(/\$?\b(\d+(\.\d{1,2})?)\b/);
    if (amountMatch) entities.amount = parseFloat(amountMatch[1]);

    // 2. Account/Recipient Extraction (e.g. "account 123", "to rec456", "John")
    // Simple heuristic: word after "to" or "account"
    const accountMatch = t.match(/(?:to|account)\s+([a-zA-Z0-9]+)/);
    if (accountMatch && !['account', 'my', 'the'].includes(accountMatch[1])) {
        entities.recipient = accountMatch[1];
    } else {
        // Fallback for names: capitalized words after "send/transfer to"
        const nameMatch = text.match(/(?:to|send)\s+([A-Z][a-z]+)/);
        if (nameMatch) entities.recipient = nameMatch[1];
    }

    // 3. Time Constraints (e.g. tomorrow, next week)
    if (t.includes('tomorrow')) entities.time = 'tomorrow';
    else if (t.includes('today')) entities.time = 'today';
    else if (t.includes('next week')) entities.time = 'next week';

    return entities;
};

export const detectIntent = (text) => {
    const t = text.toLowerCase();

    // Check specific structural phrases first
    if (t.includes('can i afford') || t.includes('can i spend')) return Intents.CAN_I_SPEND;
    if (t.includes('set') && t.includes('goal')) return Intents.SET_GOAL;
    if (t.includes('how much') && t.includes('spend')) return Intents.ANALYZE_SPEND;
    if (t.includes('show') && (t.includes('chart') || t.includes('graph'))) return Intents.SHOW_CHART;

    // Keyword scoring
    let topIntent = Intents.UNKNOWN;
    let maxScore = 0;

    for (const [intent, words] of Object.entries(keywords)) {
        let score = 0;
        words.forEach(w => {
            if (t.includes(w)) score++;
        });
        if (score > maxScore) {
            maxScore = score;
            topIntent = intent;
        }
    }

    return topIntent;
};

export const processInput = (text) => {
    return {
        originalText: text,
        intent: detectIntent(text),
        entities: extractEntities(text)
    };
};
