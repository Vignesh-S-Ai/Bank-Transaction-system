import { motion } from 'framer-motion';
import { AlertTriangle, Target } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

const STORAGE_KEY = 'nb_monthly_budget';

const BudgetTracker = ({ transactions = [] }) => {
    const [budget, setBudget] = useState(() => {
        const s = localStorage.getItem(STORAGE_KEY);
        return s ? parseFloat(s) : 2000;
    });
    const [inputVal, setInputVal] = useState('');
    const [editing, setEditing] = useState(false);

    // Current month spending (withdrawals + transfers)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const spent = transactions
        .filter(tx => new Date(tx.date) >= monthStart && (tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER'))
        .reduce((sum, tx) => sum + tx.amount, 0);

    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const remaining = Math.max(budget - spent, 0);
    const overBudget = spent > budget;

    const fillClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';

    const handleSave = () => {
        const val = parseFloat(inputVal);
        if (!val || val <= 0) return;
        setBudget(val);
        localStorage.setItem(STORAGE_KEY, val.toString());
        setEditing(false);
        toast.success(`Monthly budget set to $${val.toFixed(2)}`, { theme: 'dark' });
    };

    return (
        <div className="budget-tracker">
            <div className="flex-between mb-3">
                <div className="flex-row items-center gap-2">
                    <div className="metric-icon" style={{ background: 'rgba(167,139,250,0.12)', color: 'var(--accent-purple)' }}>
                        <Target size={18} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Monthly Budget</span>
                </div>
                {!editing ? (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setInputVal(budget.toString()); setEditing(true); }}>
                        Edit
                    </button>
                ) : (
                    <div className="flex-row" style={{ gap: '0.5rem' }}>
                        <input
                            type="number" min="1" step="1" placeholder="Amount"
                            value={inputVal} onChange={e => setInputVal(e.target.value)}
                            style={{ width: '130px', padding: '0.35rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px' }}
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            autoFocus
                        />
                        <button className="btn btn-glow btn-sm" onClick={handleSave}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>✕</button>
                    </div>
                )}
            </div>

            <div className="budget-progress-wrap">
                <div className="budget-progress-bar">
                    <motion.div
                        className={`budget-progress-fill ${fillClass}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
                <div className="budget-labels">
                    <span>Spent: <span className={overBudget ? 'text-danger' : 'text-main'} style={{ fontWeight: 600 }}>${spent.toFixed(2)}</span></span>
                    <span>{pct.toFixed(0)}%</span>
                    <span>Budget: <span style={{ fontWeight: 600 }}>${budget.toFixed(2)}</span></span>
                </div>
            </div>

            {overBudget ? (
                <div className="smart-alert danger mt-3">
                    <AlertTriangle size={16} />
                    <div className="smart-alert-text">
                        <p>Over budget by <strong>${(spent - budget).toFixed(2)}</strong> this month.</p>
                    </div>
                </div>
            ) : pct >= 80 ? (
                <div className="smart-alert warning mt-3">
                    <AlertTriangle size={16} />
                    <div className="smart-alert-text">
                        <p>Approaching budget limit. <strong>${remaining.toFixed(2)}</strong> remaining.</p>
                    </div>
                </div>
            ) : (
                <div className="flex-between mt-3">
                    <span className="text-xs text-muted">Remaining this month</span>
                    <span className="text-sm font-semibold text-success">${remaining.toFixed(2)}</span>
                </div>
            )}
        </div>
    );
};

export default BudgetTracker;
