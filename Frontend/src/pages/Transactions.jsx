import { Clock, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { deposit, getBalance, getHistory, withdraw } from '../services/transaction.service';

const Transactions = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [txType, setTxType] = useState('DEPOSIT');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const balRes = await getBalance();
            const histRes = await getHistory();
            setBalance(balRes.data.balance);
            setTransactions(histRes.data.transactions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        try {
            if (txType === 'DEPOSIT') {
                await deposit(amount);
                setSuccess(`Successfully deposited $${parseFloat(amount).toFixed(2)}`);
            } else {
                await withdraw(amount);
                setSuccess(`Successfully withdrew $${parseFloat(amount).toFixed(2)}`);
            }
            setAmount('');
            fetchData(); // Refresh list and balance
        } catch (err) {
            setError(err.message || 'Transaction failed');
        }
    };

    return (
        <div className="transactions-page fade-in">
            <header className="page-header">
                <h1>Transactions</h1>
                <p>Manage your funds and view transaction history.</p>
            </header>

            <div className="transactions-grid">
                <div className="card tx-form-card">
                    <div className="card-header">
                        <h3>New Transaction</h3>
                        <span className="balance-badge">Balance: ${balance.toFixed(2)}</span>
                    </div>
                    <div className="card-body">
                        {error && <div className="alert alert-danger">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}
                        <form onSubmit={handleTransaction} className="form">
                            <div className="form-group flex-row">
                                <button type="button" className={`btn w-full ${txType === 'DEPOSIT' ? 'btn-success' : 'btn-outline'}`} onClick={() => setTxType('DEPOSIT')}>Deposit</button>
                                <button type="button" className={`btn w-full ${txType === 'WITHDRAW' ? 'btn-danger' : 'btn-outline'}`} onClick={() => setTxType('WITHDRAW')}>Withdraw</button>
                            </div>
                            <div className="form-group">
                                <label>Amount (USD)</label>
                                <div className="input-group">
                                    <span className="input-prefix">$</span>
                                    <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full">
                                {txType === 'DEPOSIT' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="card tx-history-card">
                    <div className="card-header border-bottom">
                        <h3>History</h3>
                        <div className="search-bar">
                            <Search size={16} className="icon-muted" />
                            <input type="text" placeholder="Search..." disabled />
                        </div>
                    </div>
                    <div className="card-body no-padding">
                        {loading ? (
                            <div className="loader p-4">Loading history...</div>
                        ) : transactions.length === 0 ? (
                            <div className="empty-state p-4">No transactions found.</div>
                        ) : (
                            <ul className="full-transaction-list">
                                {transactions.map(tx => (
                                    <li key={tx.id} className="tx-list-item">
                                        <div className="tx-info">
                                            <div className={`tx-icon-lg ${tx.type === 'DEPOSIT' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                                                {tx.type === 'DEPOSIT' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </div>
                                            <div className="tx-details">
                                                <h4>{tx.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}</h4>
                                                <span className="tx-time"><Clock size={12} /> {new Date(tx.date).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className={`tx-amt-lg ${tx.type === 'DEPOSIT' ? 'text-success' : 'text-danger'}`}>
                                            {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                                        </div>
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

export default Transactions;
