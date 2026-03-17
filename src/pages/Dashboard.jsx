import { ArrowRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
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
                setRecentStmts(histRes.data.transactions.slice(0, 3)); // Only latest 3
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
                <h1>Dashboard</h1>
                <p>Welcome back! Here is your account overview.</p>
            </header>

            <div className="dashboard-cards">
                <div className="card balance-card">
                    <div className="card-header">
                        <h3>Available Balance</h3>
                        <Wallet className="icon-muted" />
                    </div>
                    <div className="card-body">
                        <h2 className="balance-amount">${balance.toFixed(2)}</h2>
                        <p className="subtitle">Active Checking Account</p>
                    </div>
                    <div className="card-footer">
                        <Link to="/transactions" className="btn btn-secondary btn-sm w-full text-center">
                            Manage Funds
                        </Link>
                    </div>
                </div>

                <div className="card summary-card">
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                        <ArrowRight className="icon-muted" />
                    </div>
                    <div className="card-body">
                        {recentStmts.length === 0 ? (
                            <p className="no-data">No recent transactions</p>
                        ) : (
                            <ul className="mini-transaction-list">
                                {recentStmts.map(tx => (
                                    <li key={tx.id} className="mini-tx-item">
                                        <div className="tx-info">
                                            <span className={`tx-icon ${tx.type === 'DEPOSIT' ? 'bg-success' : 'bg-danger'}`}>
                                                {tx.type === 'DEPOSIT' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            </span>
                                            <div className="tx-details">
                                                <span className="tx-type">{tx.type}</span>
                                                <span className="tx-date">{new Date(tx.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <span className={`tx-amt ${tx.type === 'DEPOSIT' ? 'text-success' : 'text-danger'}`}>
                                            {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="card-footer">
                        <Link to="/transactions" className="link-primary text-sm flex-center">
                            View All Activity
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
