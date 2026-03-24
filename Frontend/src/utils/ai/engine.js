import { sendAIChat } from '../../services/ai.service'; // Added LLM API Service
import { analyzeFinances } from '../aiLogic';
import { aiMemory } from './memory';
import { Intents, processInput } from './nlp';

export class AIEngine {
    constructor(balance, transactions) {
        this.analysis = analyzeFinances(balance, transactions);
        this.balance = balance;
        this.transactions = transactions; // Store for contextual LLM payload
    }

    async processMessage(message) {
        // NLP Pipeline
        const context = processInput(message);
        aiMemory.addMessage('user', message, context.intent);

        console.log("🗣️ AI NLP Processing:", context);

        let responseText = "";
        let uiComponent = null;

        // 1. Stateful Multi-Turn Workflow Handling
        const state = aiMemory.actionState;

        if (state.flow === 'transfer') {
            return this.handleTransferWorkflow(context.originalText, state, context.entities);
        }

        // 2. Intent Routing & Hybrid Fallback
        switch (context.intent) {
            case Intents.TRANSFER:
                return this.initiateTransfer(context.entities);

            case Intents.CAN_I_SPEND:
                return this.handleSpendReasoning(context.entities.amount);

            case Intents.SET_GOAL:
                return this.handleGoalSetting(context.entities.amount);

            case Intents.SHOW_CHART:
                uiComponent = 'spending_chart';
                responseText = "Here is your spending analysis grouped from Monday to Sunday:";
                break;

            case Intents.FINANCIAL_HEALTH:
                uiComponent = 'health_score';
                responseText = `Your overall financial health is rated at **${this.analysis.score}/100**. ${this.analysis.score < 50 ? 'We have some work to do.' : 'You are doing great!'}`;
                break;

            case Intents.PREDICT_FUTURE:
                responseText = `Based on your trajectory, I predict your balance will be around **$${this.analysis.futureBalance.toFixed(2)}** next week.`;
                if (this.analysis.futureBalance < 100) responseText += " ⚠️ You are at risk of a low balance. Consider slowing down discretionary spending.";
                break;

            case Intents.CHECK_BALANCE:
                responseText = `Your current balance is **$${this.balance}**.`;
                const goal = aiMemory.getPreference('savingsGoal');
                if (goal) responseText += `\nYou are ${((this.balance / goal) * 100).toFixed(0)}% towards your $${goal} goal.`;
                break;

            case Intents.UNKNOWN:
            case Intents.GREETING:
            case Intents.ASK_ADVICE:
            default:
                // Hybrid LLM Delegate
                try {
                    const llmRes = await sendAIChat(message, aiMemory.history, {
                        balance: this.balance,
                        transactions: this.transactions
                    });
                    responseText = llmRes.reply;
                } catch (err) {
                    responseText = "I'm having trouble connecting to my cloud AI right now, but I can still help you locally with checking balances or making transfers! Try asking: 'Can I spend $50?'";
                }
                break;
        }

        const reply = { text: responseText, uiComponent };
        aiMemory.addMessage('assistant', responseText, 'RESPONSE');
        return reply;
    }

    // Workflows:
    initiateTransfer(entities) {
        if (entities.amount && entities.recipient) {
            aiMemory.updateActionState('transfer', 'confirm', { amount: entities.amount, recipient: entities.recipient });
            return {
                text: `You want to send **$${entities.amount}** to **${entities.recipient}**. Reply "yes" to confirm or "no" to cancel.`,
                uiComponent: 'transfer_confirm'
            };
        }
        else if (entities.amount) {
            // Memory Context check trick: use last recipient if recent
            const lastRecipient = aiMemory.getPreference('last_recipient');
            if (lastRecipient) {
                aiMemory.updateActionState('transfer', 'confirm', { amount: entities.amount, recipient: lastRecipient });
                return { text: `Transfer **$${entities.amount}** to your previous recipient **${lastRecipient}**? Reply "yes" to confirm.` };
            }
            aiMemory.updateActionState('transfer', 'ask_recipient', { amount: entities.amount });
            return { text: `Transferring **$${entities.amount}**. Who is the recipient? Please provide their Account ID or name.` };
        } else {
            aiMemory.updateActionState('transfer', 'ask_amount');
            return { text: "Sure! How much would you like to transfer?" };
        }
    }

    handleTransferWorkflow(text, state, entities) {
        const msg = text.toLowerCase().trim();

        if (state.step === 'ask_amount') {
            const amount = entities.amount || parseFloat(msg.replace(/[^0-9.]/g, ''));
            if (!isNaN(amount) && amount > 0) {
                if (amount > this.balance) {
                    aiMemory.clearActionState();
                    return { text: "You don't have enough balance for this transfer. Transfer cancelled." };
                }
                aiMemory.updateActionState('transfer', 'ask_recipient', { amount });
                return { text: `Got it. Transferring **$${amount}**. Who is the recipient?` };
            }
            return { text: "Please enter a valid amount." };
        }

        if (state.step === 'ask_recipient') {
            const recipient = entities.recipient || msg.split(' ').pop();
            aiMemory.updateActionState('transfer', 'confirm', { recipient });
            return {
                text: `Almost done. Transfer **$${state.data.amount}** to **${recipient}**? Type "yes" to confirm or "no" to cancel.`,
                uiComponent: 'transfer_confirm'
            };
        }

        if (state.step === 'confirm') {
            if (msg === 'yes' || msg === 'y' || msg === 'confirm') {
                const { amount, recipient } = state.data;
                aiMemory.setPreference('last_recipient', recipient); // Store context
                aiMemory.clearActionState();
                return { text: `✅ Transfer of **$${amount}** to **${recipient}** executed successfully!` };
            }
            aiMemory.clearActionState();
            return { text: "Transfer cancelled." };
        }
    }

    handleSpendReasoning(requestedAmount) {
        if (!requestedAmount) {
            return { text: "Please specify an amount to evaluate, e.g., 'Can I spend $500?'" };
        }
        if (requestedAmount > this.balance) {
            return { text: `⚠️ No. You only have $${this.balance} available. A $${requestedAmount} purchase would overdraft your account.` };
        }

        // Advanced logic: Would this drop future balance below a safe threshold?
        const newFutureBalance = this.analysis.futureBalance - requestedAmount;
        if (newFutureBalance < 100) {
            return { text: `⚠️ You legally can, but I highly advise **against** it. After this $${requestedAmount} purchase, your predicted balance next week will drop to $${Math.max(0, newFutureBalance).toFixed(2)}. This is very risky considering your spending DNA is ${this.analysis.spendingDNA}.` };
        }

        return { text: `✅ Yes, it's safe! A $${requestedAmount} purchase leaves you with $${(this.balance - requestedAmount).toFixed(2)}. Your predicted future safety cushion remains strong at $${newFutureBalance.toFixed(2)}.` };
    }

    handleGoalSetting(amount) {
        if (!amount) return { text: "How much would you like your goal to be?" };
        aiMemory.setPreference('savingsGoal', amount);
        return { text: `Goal set to **$${amount}**. I'll monitor this actively and track your progress in your Snapshot!` };
    }
}
