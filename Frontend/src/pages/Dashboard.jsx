import { motion } from 'framer-motion';
import {
    Activity, ArrowDownLeft, ArrowUpRight,
    Bell,
    Bot,
    ChevronRight,
    Send, TrendingDown, TrendingUp,
    Wallet, Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Area, AreaChart,
    CartesianGrid,
    ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import AIInsights from '../components/AIInsights';
import BudgetTracker from '../components/BudgetTracker';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import SmartAlerts from '../components/SmartAlerts';
import { getBalance, getHistory } from '../services/transaction.service';
import { cardSlideUp, pageTransition, staggerContainer } from '../utils/animations';

// ── Custom count-up hook ──────────────────────────────────────
const useCountUp = (endValue, duration = 1500) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (endValue === 0) return;
        let startTime = null;
        const animate = (ts) => {
            if (!startTime) startTime = ts;
            const pct = Math.min((ts - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - pct, 4);
            setCount(endValue * ease);
            if (pct < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [endValue, duration]);
    return count;
};

// ── Build chart data from real transactions ──────────────────
const buildChartData = (transactions = []) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = months[d.getMonth()];
        const spend = transactions
            .filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
                    && (t.type === 'WITHDRAWAL' || t.type === 'TRANSFER');
            })
            .reduce((s, t) => s + t.amount, 0);
        const income = transactions
            .filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && t.type === 'DEPOSIT';
            })
            .reduce((s, t) => s + t.amount, 0);
        result.push({ month: label, spend: +spend.toFixed(2), income: +income.toFixed(2) });
    }
    return result;
};

// ── Quick action button ──────────────────────────────────────
const QuickAction = ({ icon, label, to, color }) => {
    const navigate = useNavigate();
    return (
        <motion.button
            className="quick-action-btn"
            whileHover={{ y: -3, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(to)}
            style={{ color }}
        >
            <div style={{ color }}>{icon}</div>
            <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>{label}</span>
        </motion.button>
    );
};

// ── Custom Recharts Tooltip ──────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>{label}</p>
                {payload.map(p => (
                    <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
                        {p.name.charAt(0).toUpperCase() + p.name.slice(1)}: ${p.value.toFixed(2)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// ── Metric Card ──────────────────────────────────────────────
const MetricCard = ({ title, value, subtext, icon, iconBg, iconColor, gradClass, suffix = '', prefix = '' }) => (
    <motion.div className={`card metric-card ${gradClass || ''}`} variants={cardSlideUp} whileHover={{ y: -4 }}>
        <div className="card-body">
            <div className="metric-header">
                <h3>{title}</h3>
                <div className="metric-icon" style={{ background: iconBg, color: iconColor }}>
                    {icon}
                </div>
            </div>
            <div className="metric-amount">{prefix}{value}{suffix}</div>
            <div className="metric-footer">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{subtext}</span>
            </div>
        </div>
    </motion.div>
);

// ── Main Dashboard ───────────────────────────────────────────
const Dashboard = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('User');
    const animatedBalance = useCountUp(balance);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try { const u = JSON.parse(stored); setUsername(u.full_name || u.username || 'User'); } catch { }
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const [balRes, histRes] = await Promise.all([getBalance(), getHistory()]);
                setBalance(balRes.data.balance);
                setTransactions(histRes.data.transactions);
            } catch (err) {
                console.error('Dashboard fetch error', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <DashboardSkeleton />;

    const chartData = buildChartData(transactions);
    const recentStmts = transactions.slice(0, 5);
    const thisMonth = new Date();
    const monthName = thisMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const monthlySpend = transactions
        .filter(t => new Date(t.date) >= monthStart && (t.type === 'WITHDRAWAL' || t.type === 'TRANSFER'))
        .reduce((s, t) => s + t.amount, 0);
    const monthlyIncome = transactions
        .filter(t => new Date(t.date) >= monthStart && t.type === 'DEPOSIT')
        .reduce((s, t) => s + t.amount, 0);

    return (
        <motion.div className="dashboard-page" variants={pageTransition} initial="initial" animate="animate" exit="exit">
            {/* Page Header */}
            <motion.header className="page-header" variants={cardSlideUp} initial="hidden" animate="show">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>
                            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                            <span style={{ textTransform: 'capitalize', color: 'var(--primary-color)' }}>{username.split(' ')[0]}</span> 👋
                        </h1>
                        <p>Here's your financial overview for {monthName}</p>
                    </div>
                    <div className="badge badge-info" style={{ marginTop: '0.25rem' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                        Live
                    </div>
                </div>
            </motion.header>

            {/* Metric Cards */}
            <motion.div className="dashboard-metrics-grid" variants={staggerContainer} initial="hidden" animate="show">
                <MetricCard
                    title="Total Balance"
                    value={`$${animatedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtext="Your current vault"
                    icon={<Wallet size={18} />}
                    iconBg="rgba(99,179,237,0.15)"
                    iconColor="var(--primary-color)"
                    gradClass="gradient-card-blue"
                />
                <MetricCard
                    title="Monthly Income"
                    value={`$${monthlyIncome.toFixed(2)}`}
                    subtext="Total deposits this month"
                    icon={<ArrowDownLeft size={18} />}
                    iconBg="rgba(52,211,153,0.15)"
                    iconColor="var(--success)"
                    gradClass="gradient-card-green"
                />
                <MetricCard
                    title="Monthly Spend"
                    value={`$${monthlySpend.toFixed(2)}`}
                    subtext="Withdrawals + transfers"
                    icon={<ArrowUpRight size={18} />}
                    iconBg="rgba(248,113,113,0.15)"
                    iconColor="var(--danger)"
                    gradClass="gradient-card-red"
                />
                <MetricCard
                    title="Transactions"
                    value={transactions.length}
                    subtext="Total on account"
                    icon={<Activity size={18} />}
                    iconBg="rgba(167,139,250,0.15)"
                    iconColor="var(--accent-purple)"
                    gradClass="gradient-card-purple"
                />
            </motion.div>

            {/* Main Grid – Chart + Activity */}
            <motion.div className="dashboard-main-grid" variants={staggerContainer} initial="hidden" animate="show">

                {/* Spending Chart */}
                <motion.div className="card chart-card" variants={cardSlideUp}>
                    <div className="card-header">
                        <h3>6-Month Spending Trends</h3>
                        <div className="flex-row gap-3" style={{ fontSize: '0.75rem' }}>
                            <span style={{ color: '#63b3ed' }}>● Spend</span>
                            <span style={{ color: 'var(--success)' }}>● Income</span>
                        </div>
                    </div>
                    <div className="card-body chart-wrap" style={{ paddingTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#63b3ed" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#63b3ed" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={12} />
                                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={v => `$${v}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="spend" name="spend" stroke="#63b3ed" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                                <Area type="monotone" dataKey="income" name="income" stroke="#34d399" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Right Panel: Quick Actions + Recent Activity */}
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} variants={cardSlideUp}>
                    {/* Quick Actions */}
                    <div className="card">
                        <div className="card-header"><h3>Quick Actions</h3><Zap size={16} style={{ color: 'var(--warning)' }} /></div>
                        <div className="card-body">
                            <div className="quick-actions-grid">
                                <QuickAction icon={<ArrowDownLeft size={22} />} label="Deposit" to="/transactions" color="var(--success)" />
                                <QuickAction icon={<ArrowUpRight size={22} />} label="Withdraw" to="/transactions" color="var(--danger)" />
                                <QuickAction icon={<Send size={22} />} label="Transfer" to="/transfer" color="var(--primary-color)" />
                                <QuickAction icon={<Bot size={22} />} label="AI Chat" to="/assistant" color="var(--accent-purple)" />
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card" style={{ flex: 1 }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={16} style={{ color: 'var(--primary-color)' }} />
                                <h3>Recent Activity</h3>
                            </div>
                            <Link to="/transactions" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                View All <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                            {recentStmts.length === 0 ? (
                                <div className="empty-state"><Activity size={28} className="opacity-50" /><p>No recent transactions</p></div>
                            ) : (
                                <ul className="full-transaction-list border-none">
                                    {recentStmts.map(tx => {
                                        const isCredit = tx.type === 'DEPOSIT';
                                        return (
                                            <li key={tx.id} className="tx-list-item px-0" style={{ padding: '0.75rem 1.25rem' }}>
                                                <div className="tx-info">
                                                    <span className={`tx-icon-lg`} style={{
                                                        background: isCredit ? 'var(--success-light)' : 'var(--danger-light)',
                                                        color: isCredit ? 'var(--success)' : 'var(--danger)',
                                                        width: 36, height: 36, borderRadius: 10,
                                                    }}>
                                                        {isCredit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                    </span>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tx.type}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isCredit ? 'var(--success)' : 'var(--danger)' }}>
                                                    {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Bottom Grid – AI Insights, Smart Alerts, Budget Tracker */}
            <motion.div className="dashboard-bottom-grid" variants={staggerContainer} initial="hidden" animate="show">

                {/* AI Insights */}
                <motion.div className="card" variants={cardSlideUp}>
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                                <Zap size={14} />
                            </div>
                            <h3>AI Spending Insights</h3>
                        </div>
                        <span className="badge badge-purple">Powered by Nova</span>
                    </div>
                    <div className="card-body">
                        <AIInsights transactions={transactions} />
                    </div>
                </motion.div>

                {/* Smart Alerts */}
                <motion.div className="card" variants={cardSlideUp}>
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                                <Bell size={14} />
                            </div>
                            <h3>Smart Alerts</h3>
                        </div>
                    </div>
                    <div className="card-body">
                        <SmartAlerts balance={balance} transactions={transactions} />
                    </div>
                </motion.div>

                {/* Budget Tracker */}
                <motion.div className="card" variants={cardSlideUp} style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <h3>Budget Tracker</h3>
                        <span className="badge badge-info">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="card-body">
                        <BudgetTracker transactions={transactions} />
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
