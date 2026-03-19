import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import AIAssistant from '../components/AIAssistant';
import { getBalance, getHistory } from '../services/transaction.service';
import { cardSlideUp, pageTransition } from '../utils/animations';

const AIPage = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [b, h] = await Promise.all([getBalance(), getHistory()]);
                setBalance(b.data.balance);
                setTransactions(h.data.transactions);
            } catch { } finally { setLoading(false); }
        })();
    }, []);

    return (
        <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
            <motion.header className="page-header" variants={cardSlideUp} initial="hidden" animate="show">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                        <Bot size={22} />
                    </div>
                    <div>
                        <h1 style={{ marginBottom: 0 }}>Nova AI Assistant</h1>
                        <p style={{ marginTop: '0.1rem' }}>Your personal AI-powered financial advisor</p>
                    </div>
                </div>
            </motion.header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
                {/* Chat Panel */}
                <motion.div className="card" variants={cardSlideUp}>
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                            <h3>Nova is online</h3>
                        </div>
                        <span className="badge badge-purple"><Sparkles size={11} /> AI Powered</span>
                    </div>
                    {loading ? (
                        <div className="flex-center" style={{ height: 300 }}>
                            <div className="spinner" />
                        </div>
                    ) : (
                        <AIAssistant balance={balance} transactions={transactions} />
                    )}
                </motion.div>

                {/* Info Panel */}
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} variants={cardSlideUp}>
                    <div className="card">
                        <div className="card-header"><h3>Account Snapshot</h3></div>
                        <div className="card-body">
                            <div style={{ marginBottom: '1rem' }}>
                                <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Balance</p>
                                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary-color)' }}>${balance.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Transactions</p>
                                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 700 }}>{transactions.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><h3>Nova Can Help With</h3></div>
                        <div className="card-body" style={{ padding: '1rem' }}>
                            {[
                                '💰 Check your current balance',
                                '📅 Monthly spending summary',
                                '📈 Weekly spending trends',
                                '🔄 Latest transaction details',
                                '💡 Personalized saving tips',
                                '📊 Transaction count & stats',
                            ].map((item, i) => (
                                <div key={i} style={{ padding: '0.5rem 0', borderBottom: i < 5 ? '1px solid var(--border-color)' : 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(99,179,237,0.08))', border: '1px solid rgba(167,139,250,0.2)' }}>
                        <div className="card-body" style={{ padding: '1.25rem' }}>
                            <p className="text-xs" style={{ color: 'var(--accent-purple)', fontWeight: 600, marginBottom: '0.5rem' }}>⚡ Pro Tip</p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                                Nova analyzes your real transaction data to give personalized insights. Try asking about spending trends!
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AIPage;
