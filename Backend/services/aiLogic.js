/**
 * Nova AI — Scenario Simulation Engine (SIMS)
 * Predicts balance and health score impact of potential transactions.
 */

class AISimulator {
    /**
     * @param {number} balance - Current account balance
     * @param {number} amount - Amount to spend or deposit
     * @param {string} type - 'SPEND' or 'DEPOSIT'
     * @param {Object} context - { monthlyIncome, monthlySpend, savingsGoal }
     */
    simulateImpact(balance, amount, type = 'SPEND', context = {}) {
        const { monthlyIncome = 0, monthlySpend = 0, savingsGoal = 0 } = context;

        // 1. New Balance
        const newBalance = type === 'SPEND' ? balance - amount : balance + amount;

        // 2. New Monthly Spending Ratio
        const newSpend = type === 'SPEND' ? monthlySpend + amount : monthlySpend;
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - newSpend) / monthlyIncome) * 100 : 0;

        // 3. Predicted Financial Health Score (0-100)
        let score = 100;

        // Low balance penalty
        if (newBalance < 100) score -= 60;
        else if (newBalance < 500) score -= 30;
        else if (newBalance < 1000) score -= 10;

        // High spends penalty
        if (savingsRate < 5) score -= 30;
        else if (savingsRate < 15) score -= 15;

        // Goal reach probability
        if (savingsGoal > 0) {
            const gap = savingsGoal - newBalance;
            if (gap > 0) {
                const monthsToGoal = gap / (Math.max(1, monthlyIncome - newSpend) || 1);
                if (monthsToGoal > 12) score -= 10;
            }
        }

        score = Math.max(0, score);

        // 4. Advisory Tone Generation
        let advice = "";
        const diff = balance - newBalance;

        if (newBalance < 0) {
            advice = `🚫 This spend of **$${amount}** would bankrupt your account. Current balance is only $${balance}.`;
        } else if (score < 40) {
            advice = `⚠️ I advise extreme caution. Spending **$${amount}** drops your health score to **${score}**. You'd be left with just **$${newBalance.toFixed(2)}**.`;
        } else if (score < 70) {
            advice = `⚖️ You can afford it, but it slows your momentum. Your score would dip to **${score}**. Remaining balance: **$${newBalance.toFixed(2)}**.`;
        } else {
            advice = `✅ You're in a strong position! Even after this **$${amount}** spend, your score stays high at **${score}**. Balance: **$${newBalance.toFixed(2)}**.`;
        }

        return {
            originalBalance: balance,
            newBalance,
            score,
            advice,
            isSafe: score > 50 && newBalance > 200
        };
    }
}

module.exports = new AISimulator();
