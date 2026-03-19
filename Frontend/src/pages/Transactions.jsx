import { motion } from 'framer-motion';
import { Activity, Calendar, Clock, Search, Send, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';
import { deposit, getBalance, getHistory, withdraw } from '../services/transaction.service';
import { cardSlideUp, listItemAnim, pageTransition, staggerContainer } from '../utils/animations';
import useSoundFX from '../utils/sounds';

// ── Debounce hook ─────────────────────────────────────────────
const useDebounce = (val, ms) => {
    const [d, set] = useState(val);
    useEffect(() => {
        const t = setTimeout(() => set(val), ms);
        return () => clearTimeout(t);
    }, [val, ms]);
    return d;
};

// ── Count-up hook ─────────────────────────────────────────────
const useCountUp = (end, dur = 1000) => {
    const [v, set] = useState(0);
    useEffect(() => {
        let st = null;
        const go = (ts) => {
            if (!st) st = ts;
            const p = Math.min((ts - st) / dur, 1);
            set(end * (1 - Math.pow(1 - p, 4)));
            if (p < 1) requestAnimationFrame(go);
        };
        requestAnimationFrame(go);
    }, [end, dur]);
    return v;
};

// ── Group transactions by date label ─────────────────────────
const groupByDate = (txs) => {
    const groups = {};
    txs.forEach(tx => {
        const d = new Date(tx.date);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        let label;
        if (d >= today) label = 'Today';
        else if (d >= yesterday) label = 'Yesterday';
        else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if (!groups[label]) groups[label] = [];
        groups[label].push(tx);
    });
    return groups;
};

// ── Tx Icon ───────────────────────────────────────────────────
const TxIcon = ({ type }) => {
    const isDeposit = type === 'DEPOSIT';
    const isTransfer = type === 'TRANSFER';
    return (
        <div className="tx-icon-lg" style={{
            background: isDeposit ? 'var(--success-light)' : isTransfer ? 'rgba(99,179,237,0.1)' : 'var(--danger-light)',
            color: isDeposit ? 'var(--success)' : isTransfer ? 'var(--primary-color)' : 'var(--danger)',
            borderRadius: 12,
            boxShadow: isDeposit
                ? '0 0 12px rgba(52,211,153,0.2)'
                : isTransfer
                    ? '0 0 12px rgba(99,179,237,0.2)'
                    : '0 0 12px rgba(248,113,113,0.2)',
        }}>
            {isDeposit ? <TrendingUp size={18} /> : isTransfer ? <Send size={18} /> : <TrendingDown size={18} />}
        </div>
    );
};

// ── Main ─────────────────────────────────────────────────────
const Transactions = () => {
    const [balance, setBalance] = useState(0);
    const animBalance = useCountUp(balance, 1200);
    const [balPop, setBalPop] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [txType, setTxType] = useState('DEPOSIT');
    const [amount, setAmount] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterDate, setFilterDate] = useState('ALL');
    const dSearch = useDebounce(search, 300);

    const [showConfirm, setShowConfirm] = useState(false);
    const pendingRef = useRef(null);
    const sfx = useSoundFX();

    // Pop balance display when it changes
    useEffect(() => {
        if (balance === 0) return;
        setBalPop(true);
        const t = setTimeout(() => setBalPop(false), 500);
        return () => clearTimeout(t);
    }, [balance]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balRes, histRes] = await Promise.all([getBalance(), getHistory()]);
            setBalance(balRes.data.balance);
            setTransactions(histRes.data.transactions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const shake = () => {
        sfx.error();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || Number(amount) <= 0) { shake(); toast.error('Enter a valid amount'); return; }
        pendingRef.current = { type: txType, amount: parseFloat(amount) };
        setShowConfirm(true);
    };

    const executeTransaction = async () => {
        const { type, amount: amt } = pendingRef.current;
        setShowConfirm(false);
        setSubmitting(true);
        try {
            if (type === 'DEPOSIT') {
                await deposit(amt);
                toast.success('✅ Deposited $' + amt.toFixed(2) + ' successfully', { theme: 'dark', icon: false });
            } else {
                await withdraw(amt);
                toast.success('✅ Withdrew $' + amt.toFixed(2) + ' successfully', { theme: 'dark', icon: false });
            }
            sfx.success();
            setAmount('');
            // Immediately update balance optimistically, then re-fetch
            setBalance(prev => type === 'DEPOSIT' ? prev + amt : prev - amt);
            fetchData();
        } catch (err) {
            sfx.error();
            toast.error(err.response?.data?.message || err.message || 'Transaction failed');
            shake();
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = useMemo(() => {
        const now = new Date();
        return transactions.filter(tx => {
            const matchSearch = !dSearch ||
                tx.type.toLowerCase().includes(dSearch.toLowerCase()) ||
                tx.amount.toString().includes(dSearch) ||
                (tx.id && tx.id.toString().includes(dSearch));
            const matchType = filterType === 'ALL' || tx.type === filterType;
            let matchDate = true;
            if (filterDate === '7D') matchDate = new Date(tx.date) >= new Date(now - 7 * 864e5);
            else if (filterDate === '30D') matchDate = new Date(tx.date) >= new Date(now - 30 * 864e5);
            else if (filterDate === 'THIS_MONTH') {
                const ms = new Date(now.getFullYear(), now.getMonth(), 1);
                matchDate = new Date(tx.date) >= ms;
            }
            return matchSearch && matchType && matchDate;
        });
    }, [transactions, dSearch, filterType, filterDate]);

    const grouped = useMemo(() => groupByDate(filtered), [filtered]);

    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    return (
        <motion.div className="transactions-page" variants={pageTransition} initial="initial" animate="animate" exit="exit">
            <motion.header className="page-header" variants={cardSlideUp}>
                <h1>Transactions</h1>
                <p>Manage deposits, withdrawals, and view your complete ledger.</p>
            </motion.header>

            <div className="transactions-grid">

                {/* ── Action Panel ── */}
                <motion.div
                    className="card tx-form-card"
                    variants={cardSlideUp}
                    animate={isShaking ? { x: [-10, 10, -8, 8, 0], transition: { duration: 0.4 } } : {}}
                >
                    <div className="card-header">
                        <h3>Quick Action</h3>
                        <motion.div
                            className="balance-badge"
                            animate={balPop ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 0.45 }}
                        >
                            <Wallet size={13} />
                            ${animBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </motion.div>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            {/* Type toggle */}
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 4, gap: 4, marginBottom: '1.5rem' }}>
                                {['DEPOSIT', 'WITHDRAWAL'].map(t => (
                                    <motion.button
                                        key={t} type="button" whileTap={{ scale: 0.96 }}
                                        className={'btn w-full ' + (txType === t ? 'btn-glow' : 'btn-ghost')}
                                        style={txType === t ? {
                                            background: t === 'DEPOSIT' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                                            border: '1px solid ' + (t === 'DEPOSIT' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'),
                                            color: t === 'DEPOSIT' ? 'var(--success)' : 'var(--danger)',
                                        } : {}}
                                        onClick={() => setTxType(t)}
                                    >
                                        {t === 'DEPOSIT' ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                                        {t === 'DEPOSIT' ? 'Deposit' : 'Withdraw'}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Amount */}
                            <div className="form-group">
                                <label>Amount (USD)</label>
                                <div className="input-group mt-2">
                                    <span className="input-prefix" style={{ color: txType === 'DEPOSIT' ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '1.1rem' }}>$</span>
                                    <input
                                        type="number" step="0.01" min="0.01" value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        style={{ fontSize: '1.3rem', fontWeight: 600 }}
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                className="btn w-full"
                                disabled={submitting}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    padding: '0.9rem', fontSize: '0.95rem', fontWeight: 600,
                                    background: txType === 'DEPOSIT'
                                        ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(52,211,153,0.2))'
                                        : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(248,113,113,0.2))',
                                    border: '1px solid ' + (txType === 'DEPOSIT' ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'),
                                    color: txType === 'DEPOSIT' ? 'var(--success)' : 'var(--danger)',
                                }}
                            >
                                {submitting
                                    ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                    : 'Execute ' + (txType.charAt(0) + txType.slice(1).toLowerCase())
                                }
                            </motion.button>
                        </form>

                        {/* Mini stats */}
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <p className="text-xs text-muted" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>This Month</p>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {['DEPOSIT', 'WITHDRAWAL'].map(t => {
                                    const total = transactions
                                        .filter(tx => new Date(tx.date) >= monthStart && tx.type === t)
                                        .reduce((s, tx) => s + tx.amount, 0);
                                    const label = t === 'DEPOSIT' ? 'Deposit' : 'Withdraw';
                                    return (
                                        <div key={t} style={{
                                            flex: 1, padding: '0.75rem', borderRadius: 10, textAlign: 'center',
                                            background: t === 'DEPOSIT' ? 'var(--success-light)' : 'var(--danger-light)',
                                            border: '1px solid ' + (t === 'DEPOSIT' ? 'var(--success-border)' : 'var(--danger-border)'),
                                        }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: t === 'DEPOSIT' ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                {label}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: t === 'DEPOSIT' ? 'var(--success)' : 'var(--danger)' }}>
                                                ${total.toFixed(0)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── History Panel ── */}
                <motion.div className="card tx-history-card" variants={cardSlideUp}>
                    <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                        <h3>Transaction Ledger</h3>
                        <div className="search-filter-bar">
                            <div className="search-bar">
                                <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                <input placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                                <option value="ALL">All Types</option>
                                <option value="DEPOSIT">Deposit</option>
                                <option value="WITHDRAWAL">Withdrawal</option>
                                <option value="TRANSFER">Transfer</option>
                            </select>
                            <select className="filter-select" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
                                <option value="ALL">All Time</option>
                                <option value="7D">Last 7 Days</option>
                                <option value="30D">Last 30 Days</option>
                                <option value="THIS_MONTH">This Month</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ maxHeight: '620px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'var(--border-color) transparent' }}>
                        {loading ? (
                            <div className="flex-center p-4" style={{ height: 200 }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                                    <Activity size={32} style={{ color: 'var(--primary-color)' }} />
                                </motion.div>
                            </div>
                        ) : Object.keys(grouped).length === 0 ? (
                            <div className="empty-state" style={{ padding: '4rem 1rem' }}>
                                <Search size={40} className="opacity-50" />
                                <p>No transactions match your filters.</p>
                            </div>
                        ) : (
                            Object.entries(grouped).map(([dateLabel, txs]) => (
                                <div key={dateLabel}>
                                    <div className="tx-group-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1.5rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Calendar size={12} />
                                            {dateLabel}
                                        </span>
                                        <span>{txs.length} tx</span>
                                    </div>
                                    <motion.ul className="full-transaction-list" variants={staggerContainer} initial="hidden" animate="show">
                                        {txs.map(tx => {
                                            const isDeposit = tx.type === 'DEPOSIT';
                                            const isTransfer = tx.type === 'TRANSFER';
                                            return (
                                                <motion.li key={tx.id} variants={listItemAnim} className="tx-list-item">
                                                    <div className="tx-info">
                                                        <TxIcon type={tx.type} />
                                                        <div className="tx-details">
                                                            <h4 style={{ textTransform: 'capitalize' }}>
                                                                {tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}
                                                            </h4>
                                                            <span className="tx-time">
                                                                <Clock size={11} />
                                                                {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                                                        <span className="tx-amt-lg" style={{ color: isDeposit ? 'var(--success)' : isTransfer ? 'var(--primary-color)' : 'var(--danger)' }}>
                                                            {isDeposit ? '+' : '-'}${tx.amount.toFixed(2)}
                                                        </span>
                                                        <span className={'badge ' + (isDeposit ? 'badge-success' : isTransfer ? 'badge-info' : 'badge-danger')} style={{ fontSize: '0.65rem' }}>
                                                            {tx.type}
                                                        </span>
                                                    </div>
                                                </motion.li>
                                            );
                                        })}
                                    </motion.ul>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        <span>
                            Net Total: <strong style={{
                                color: filtered.reduce((s, t) =>
                                    s + (t.type === 'DEPOSIT' ? t.amount : -t.amount), 0) >= 0
                                    ? 'var(--success)' : 'var(--danger)'
                            }}>
                                {(() => {
                                    const net = filtered.reduce((s, t) =>
                                        s + (t.type === 'DEPOSIT' ? t.amount : -t.amount), 0);
                                    return (net >= 0 ? '+' : '-') + '$' + Math.abs(net).toFixed(2);
                                })()}
                            </strong>
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={showConfirm}
                title={pendingRef.current ? ('Confirm ' + (pendingRef.current.type.charAt(0) + pendingRef.current.type.slice(1).toLowerCase())) : 'Confirm'}
                message={pendingRef.current ? ('You are about to ' + pendingRef.current.type.toLowerCase() + ' $' + pendingRef.current.amount.toFixed(2) + '. This action cannot be undone.') : ''}
                confirmLabel={pendingRef.current?.type === 'DEPOSIT' ? 'Deposit Funds' : 'Withdraw Funds'}
                confirmClass={pendingRef.current?.type === 'DEPOSIT' ? 'btn-success' : 'btn-danger'}
                onConfirm={executeTransaction}
                onCancel={() => setShowConfirm(false)}
                icon={pendingRef.current?.type === 'DEPOSIT' ? <TrendingUp size={26} /> : <TrendingDown size={26} />}
            />
        </motion.div>
    );
};

export default Transactions;
