import { Activity, ArrowRight, BarChart3, CreditCard, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBalance, getHistory } from '../services/transaction.service';

const Dashboard = () => {
    const [balance, setBalance] = useState(0);
    const [recentStmts, setRecentStmts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const balRes = await getBalance();
                const histRes = await getHistory();
                setBalance(balRes.data.balance);
                setRecentStmts(histRes.data.transactions.slice(0, 4)); // Get latest 4
            } catch (err) {
                console.error("Dashboard fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="loader">Loading dashboard...</div>;

    return (
        <div className="dashboard-page fade-in">
            <header className="page-header">
                <div>
                    <h1>Welcome back, Demo User 👋</h1>
                    <p>Here is your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
            </header>

            <div className="dashboard-metrics-grid">
                <div className="card metric-card primary-gradient">
                    <div className="card-body">
                        <div className="metric-header">
                            <h3>Total Balance</h3>
                            <Wallet size={24} className="opacity-80" />
                        </div>
                        <h2 className="metric-amount">${balance.toFixed(2)}</h2>
                        <div className="metric-footer">
                            <span className="badge bg-white-20">+2.5%</span> <span className="text-sm opacity-80">from last month</span>
                        </div>
                    </div>
                </div>

                <div className="card metric-card">
                    <div className="card-body">
                        <div className="metric-header">
                            <h3 className="text-muted">Monthly Spending</h3>
                            <CreditCard size={24} className="icon-primary" />
                        </div>
                        <h2 className="metric-amount text-main">$1,250.00</h2>
                        <div className="metric-footer mt-auto">
                            <Link to="/transactions" className="link-primary text-sm flex-center">
                                Analyze Spending <ArrowRight size={14} className="ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="card metric-card">
                    <div className="card-body">
                        <div className="metric-header">
                            <h3 className="text-muted">Savings Goal</h3>
                            <BarChart3 size={24} className="icon-success" />
                        </div>
                        <h2 className="metric-amount text-main">$5,000.00</h2>
                        <div className="progress-bar-container">
                            <div className="progress-bar bg-success" style={{ width: '65%' }}></div>
                        </div>
                        <p className="text-sm text-muted mt-2">65% reached</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-main-grid">
                <div className="card summary-card fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="card-header">
                        <div className="flex-center" style={{ gap: '0.5rem' }}>
                            <Activity className="icon-primary" />
                            <h3>Recent Activity</h3>
                        </div>
                        <Link to="/transactions" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    <div className="card-body">
                        {recentStmts.length === 0 ? (
                            <div className="empty-state p-4">
                                <TrendingUp size={32} className="icon-muted mb-2 opacity-50" />
                                <p>No recent transactions</p>
                            </div>
                        ) : (
                            <ul className="full-transaction-list border-none">
                                {recentStmts.map(tx => (
                                    <li key={tx.id} className="tx-list-item px-0">
                                        <div className="tx-info">
                                            <span className={`tx-icon-lg ${tx.type === 'DEPOSIT' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                                                {tx.type === 'DEPOSIT' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </span>
                                            <div className="tx-details">
                                                <h4>{tx.type === 'DEPOSIT' ? 'Deposit Received' : 'Funds Withdrawn'}</h4>
                                                <span className="tx-time">{new Date(tx.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <span className={`tx-amt-lg ${tx.type === 'DEPOSIT' ? 'text-success' : 'text-main'}`}>
                                            {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
