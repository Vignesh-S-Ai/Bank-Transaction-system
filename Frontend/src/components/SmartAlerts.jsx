import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, TrendingDown } from 'lucide-react';

const ALERT_ICONS = {
    warning: <AlertTriangle size={18} />,
    danger: <TrendingDown size={18} />,
    success: <CheckCircle size={18} />,
    info: <Info size={18} />,
};

/**
 * Generates smart alerts from balance & transaction data.
 */
export const buildAlerts = (balance, transactions = []) => {
    const alerts = [];
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 3600 * 1000);

    // Low balance
    if (balance < 200) {
        alerts.push({ id: 'low-bal', type: 'danger', title: 'Low Balance', text: `Your balance is $${balance.toFixed(2)} — consider a deposit soon.` });
    } else if (balance < 500) {
        alerts.push({ id: 'low-bal-warn', type: 'warning', title: 'Balance Notice', text: `Balance is getting low ($${balance.toFixed(2)}). Monitor your spending.` });
    }

    // Frequent transactions
    const recentCount = transactions.filter(tx => new Date(tx.date) >= weekAgo).length;
    if (recentCount >= 10) {
        alerts.push({ id: 'freq', type: 'warning', title: 'High Activity', text: `${recentCount} transactions in the last 7 days — unusually frequent.` });
    }

    // High withdrawals this week
    const withdrawn = transactions
        .filter(tx => new Date(tx.date) >= weekAgo && (tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER'))
        .reduce((sum, tx) => sum + tx.amount, 0);
    if (withdrawn > 1000) {
        alerts.push({ id: 'high-spend', type: 'danger', title: 'High Spending', text: `You've spent $${withdrawn.toFixed(2)} in the last 7 days.` });
    } else if (withdrawn > 400) {
        alerts.push({ id: 'mod-spend', type: 'warning', title: 'Spending Up', text: `$${withdrawn.toFixed(2)} withdrawn this week. Keep an eye on it.` });
    }

    // All good
    if (alerts.length === 0) {
        alerts.push({ id: 'ok', type: 'success', title: 'All Clear', text: 'Your account looks healthy. No unusual activity detected.' });
    }

    return alerts;
};

const SmartAlerts = ({ balance, transactions }) => {
    const alerts = buildAlerts(balance, transactions);

    return (
        <div className="smart-alerts-list">
            <AnimatePresence>
                {alerts.map((a, i) => (
                    <motion.div
                        key={a.id}
                        className={`smart-alert ${a.type}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <span className="smart-alert-icon">{ALERT_ICONS[a.type]}</span>
                        <div className="smart-alert-text">
                            <h4>{a.title}</h4>
                            <p>{a.text}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default SmartAlerts;
