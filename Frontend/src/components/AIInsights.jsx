import { motion } from 'framer-motion';
import { ArrowDownLeft, ShoppingBag, TrendingUp, Zap } from 'lucide-react';

/**
 * Derive AI-style financial insights from real transaction data.
 */
export const buildInsights = (transactions = []) => {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 3600 * 1000);
    const prevWeekStart = new Date(now - 14 * 24 * 3600 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekSpend = transactions
        .filter(t => new Date(t.date) >= weekAgo && (t.type === 'WITHDRAWAL' || t.type === 'TRANSFER'))
        .reduce((s, t) => s + t.amount, 0);

    const lastWeekSpend = transactions
        .filter(t => new Date(t.date) >= prevWeekStart && new Date(t.date) < weekAgo && (t.type === 'WITHDRAWAL' || t.type === 'TRANSFER'))
        .reduce((s, t) => s + t.amount, 0);

    const monthlyDeposits = transactions
        .filter(t => new Date(t.date) >= monthStart && t.type === 'DEPOSIT')
        .reduce((s, t) => s + t.amount, 0);

    const totalTx = transactions.length;
    const thisWeekTx = transactions.filter(t => new Date(t.date) >= weekAgo).length;

    const insights = [];

    // Week-over-week spend
    if (lastWeekSpend > 0) {
        const diff = thisWeekSpend - lastWeekSpend;
        const pct = Math.abs((diff / lastWeekSpend) * 100).toFixed(0);
        if (diff > 0) {
            insights.push({
                id: 'wow', icon: <TrendingUp size={16} />, iconBg: 'rgba(248,113,113,0.12)', iconColor: 'var(--danger)',
                label: 'Spending Increased', value: `+${pct}% vs last week`,
            });
        } else if (diff < 0) {
            insights.push({
                id: 'wow-down', icon: <TrendingUp size={16} />, iconBg: 'rgba(52,211,153,0.12)', iconColor: 'var(--success)',
                label: 'Spending Decreased', value: `-${pct}% vs last week`,
            });
        }
    }

    // Monthly income
    if (monthlyDeposits > 0) {
        insights.push({
            id: 'income', icon: <ArrowDownLeft size={16} />, iconBg: 'rgba(52,211,153,0.12)', iconColor: 'var(--success)',
            label: 'Monthly Income', value: `$${monthlyDeposits.toFixed(2)}`,
        });
    }

    // Weekly activity
    insights.push({
        id: 'activity', icon: <Zap size={16} />, iconBg: 'rgba(251,191,36,0.12)', iconColor: 'var(--warning)',
        label: 'This Week\'s Activity', value: `${thisWeekTx} transaction${thisWeekTx !== 1 ? 's' : ''}`,
    });

    // Top category (mock — all withdrawals = "General Spending")
    const withdrawCount = transactions.filter(t => t.type === 'WITHDRAWAL').length;
    const transferCount = transactions.filter(t => t.type === 'TRANSFER').length;
    const topCat = transferCount > withdrawCount ? 'Transfers' : 'Withdrawals';
    if (totalTx > 0) {
        insights.push({
            id: 'cat', icon: <ShoppingBag size={16} />, iconBg: 'rgba(99,179,237,0.12)', iconColor: 'var(--primary-color)',
            label: 'Top Category', value: topCat,
        });
    }

    return insights;
};

const AIInsights = ({ transactions }) => {
    const insights = buildInsights(transactions);

    if (insights.length === 0) {
        return <p className="text-muted text-sm" style={{ padding: '1rem 0' }}>Make some transactions to unlock AI insights.</p>;
    }

    return (
        <div className="ai-insights-list">
            {insights.map((ins, i) => (
                <motion.div
                    key={ins.id}
                    className="ai-insight-card"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                >
                    <div className="ai-insight-icon" style={{ background: ins.iconBg, color: ins.iconColor }}>
                        {ins.icon}
                    </div>
                    <div className="ai-insight-text">
                        <h4>{ins.label}</h4>
                        <p style={{ color: ins.iconColor, fontWeight: 600 }}>{ins.value}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default AIInsights;
