// AI Logic Engine for Nova Assistant

export const analyzeFinances = (balance, transactions) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Group transactions for the current week (Monday to Sunday)
    const monday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const weeklyChart = { labels: [], values: [], normalized: [] };
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    let currentWeekSpend = 0;

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);

        const sum = transactions
            .filter(t => {
                const td = new Date(t.date);
                return td.getFullYear() === d.getFullYear() &&
                    td.getMonth() === d.getMonth() &&
                    td.getDate() === d.getDate() &&
                    (t.type === 'WITHDRAWAL' || t.type === 'TRANSFER');
            })
            .reduce((s, t) => s + t.amount, 0);

        weeklyChart.labels.push(days[i]);
        weeklyChart.values.push(sum);
        currentWeekSpend += sum;
    }
    const maxVal = Math.max(...weeklyChart.values, 1);
    weeklyChart.normalized = weeklyChart.values.map(v => v / maxVal);

    // Category-based breakdown
    const categories = Array.isArray(transactions) ? transactions.reduce((acc, t) => {
        const cat = t.category || 'Other';
        if (t.type === 'WITHDRAWAL' || t.type === 'TRANSFER') {
            acc[cat] = (acc[cat] || 0) + t.amount;
        }
        return acc;
    }, {}) : {};

    const topCategory = Object.entries(categories).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    // Monthly stats
    const monthTransactions = transactions.filter(t => new Date(t.date) >= monthStart);

    const monthlyIncome = monthTransactions
        .filter(t => t.type === 'DEPOSIT')
        .reduce((s, t) => s + t.amount, 0);

    const monthlySpend = monthTransactions
        .filter(t => t.type === 'WITHDRAWAL' || t.type === 'TRANSFER')
        .reduce((s, t) => s + t.amount, 0);

    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlySpend) / monthlyIncome) * 100 : 0;

    // Anomalies/Overspending Detection
    const dailyAvgSpend = currentWeekSpend / (now.getDay() === 0 ? 7 : now.getDay());
    const isOverspending = monthlySpend > monthlyIncome && monthlyIncome > 0;

    // 1. Spending DNA
    let spendingDNA = 'Balanced';
    if (savingsRate > 20) spendingDNA = 'Conservative';
    else if (savingsRate < 0 || isOverspending) spendingDNA = 'Aggressive';
    else if (savingsRate < 10) spendingDNA = 'Impulsive';

    // 2. Future Balance Prediction (Next 7 days)
    const futureBalance = Math.max(0, balance - (dailyAvgSpend * 7));

    // 3. Risk Score (0-100)
    let riskScore = 0;
    if (balance < 200) riskScore += 40;
    if (isOverspending) riskScore += 30;
    if (spendingDNA === 'Aggressive') riskScore += 20;
    if (futureBalance === 0) riskScore += 30;
    riskScore = Math.min(100, riskScore);

    // 4. Emotional State
    let emotion = 'neutral';
    if (riskScore > 60) emotion = 'concerned';
    else if (savingsRate > 15 && balance > 500) emotion = 'happy';

    // Health Score
    let score = Math.max(0, 100 - riskScore);

    // AI Suggestions
    const autoActions = [];
    if (riskScore > 60) autoActions.push("Set spending limit on " + topCategory);
    if (balance > 1000 && savingsRate > 15) autoActions.push("Sweep $200 into a high-yield savings vault");
    else if (balance < 500) autoActions.push("Audit recurring " + topCategory + " subscriptions");

    return {
        score,
        monthlySpend,
        monthlyIncome,
        weeklyChart,
        futureBalance,
        spendingDNA,
        riskScore,
        emotion,
        savingsRate,
        topCategory,
        isOverspending,
        autoActions
    };
};

export const generateAIResponse = (message, context, chatState) => {
    const { balance, transactions, analysis } = context;
    const msg = message.toLowerCase().trim();

    // Contextual UI triggers
    let uiComponent = null;

    // Multi-step & Context Memory
    if (msg.includes('set goal') || msg.includes('savings goal')) {
        const amount = parseFloat(msg.replace(/[^0-9.]/g, ''));
        if (!isNaN(amount) && amount > 0) {
            return {
                text: `Awesome! I've set your savings goal to **$${amount}**. I'll track your progress and remind you if you get off course! 🎯`,
                newState: { ...chatState, savingsGoal: amount }
            };
        }
        return { text: "How much would you like your savings goal to be? e.g. 'Set goal to 1000'.", newState: chatState };
    }

    if (chatState.flow === 'transfer') {
        if (chatState.step === 'ask_amount') {
            const amount = parseFloat(msg.replace(/[^0-9.]/g, ''));
            if (!isNaN(amount) && amount > 0) {
                if (amount > balance) {
                    return { text: "You don't have enough balance for this transfer. Transfer cancelled.", newState: { ...chatState, flow: null } };
                }
                return {
                    text: `Great, transferring $${amount}. Who is the recipient? Please enter their Account ID.`,
                    newState: { ...chatState, flow: 'transfer', step: 'ask_recipient', amount }
                };
            }
            return { text: "Please enter a valid amount to transfer.", newState: chatState };
        }
        if (chatState.step === 'ask_recipient') {
            const recipient = msg;
            return {
                text: `You want to transfer $${chatState.amount} to account "${recipient}". Reply "yes" to confirm or "no" to cancel.`,
                newState: { ...chatState, step: 'confirm', recipient },
                uiComponent: 'transfer_confirm'
            };
        }
        if (chatState.step === 'confirm') {
            if (msg === 'yes' || msg === 'confirm' || msg === 'y') {
                return {
                    text: `✅ Transfer of $${chatState.amount} to ${chatState.recipient} initiated successfully!\n*(Note: This is simulated in chat)*`,
                    newState: { ...chatState, flow: null }
                };
            }
            return { text: "Transfer cancelled.", newState: { ...chatState, flow: null } };
        }
    }

    if (msg.includes('transfer') || msg.includes('send money')) {
        return {
            text: "Sure! I can help you with a transfer. How much would you like to send?",
            newState: { ...chatState, flow: 'transfer', step: 'ask_amount' }
        };
    }

    // Advanced Features Triggers
    if (msg.includes('dna') || msg.includes('type of spender')) {
        return {
            text: `After analyzing your habits, your **Spending DNA** is classified as **${analysis.spendingDNA}**. ${analysis.spendingDNA === 'Impulsive' ? 'Try setting a daily budget to gain more control.' : analysis.spendingDNA === 'Conservative' ? 'You are excellent at saving!' : 'You have a healthy balance of spending and saving.'}`,
            newState: chatState
        };
    }

    if (msg.includes('predict') || msg.includes('future') || msg.includes('next week')) {
        return {
            text: `Based on your recent weekly spending trajectory, your predicted balance 7 days from now is **$${analysis.futureBalance.toFixed(2)}**.`,
            newState: chatState
        };
    }

    if (msg.includes('risk') || msg.includes('danger')) {
        return {
            text: `Your current **Financial Risk Score is ${analysis.riskScore}/100**. ${analysis.riskScore > 50 ? 'You are showing risky behaviors like high spending relative to balance.' : 'Your risk is minimal. Keep it up!'}`,
            newState: chatState
        };
    }

    if (msg.includes('auto action') || msg.includes('suggest') || msg.includes('recommend')) {
        return {
            text: `Here are my top auto-action suggestions for you:\n\n${analysis.autoActions.map(a => `• ${a}`).join('\n')}`,
            newState: chatState
        };
    }

    if ((msg.includes('show') || msg.includes('see')) && (msg.includes('spend') || msg.includes('chart') || msg.includes('graph'))) {
        return {
            text: "Here is your spending analysis grouped from Monday to Sunday:",
            uiComponent: 'spending_chart',
            newState: chatState
        };
    }

    if (msg.includes('health') || msg.includes('score')) {
        return {
            text: `Your financial health score is **${analysis.score}/100**.`,
            uiComponent: 'health_score',
            newState: chatState
        };
    }

    if (msg.includes('balance') || msg.includes('how much')) {
        const tone = analysis.emotion === 'concerned' ? 'Please be careful, ' : analysis.emotion === 'happy' ? 'Great news! ' : '';
        return {
            text: `${tone}Your current balance is **$${balance.toFixed(2)}**. ${chatState.savingsGoal ? `\nYou are ${((balance / chatState.savingsGoal) * 100).toFixed(0)}% towards your $${chatState.savingsGoal} savings goal!` : ''}`,
            newState: chatState
        };
    }

    return {
        text: `I can help you with insights and advanced predictions! Try asking:\n- "What's my spending DNA?"\n- "Predict my future balance"\n- "What is my risk score?"\n- "Set savings goal to 500"`,
        newState: chatState
    };
};
