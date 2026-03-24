import { motion } from 'framer-motion';
import { AlertTriangle, Bot, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import AIAssistant from '../components/AIAssistant';
import { getBalance, getHistory } from '../services/transaction.service';
import { analyzeFinances } from '../utils/aiLogic';
import { cardSlideUp, pageTransition } from '../utils/animations';

const AIPage = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [b, h] = await Promise.all([getBalance(), getHistory()]);
                const bal = b.data.balance;
                const txs = h.data.transactions;
                setBalance(bal);
                setTransactions(txs);
                setAnalysis(analyzeFinances(bal, txs));
            } catch { } finally { setLoading(false); }
        })();
    }, []);

    // Insight icon mapper
    const getInsightIcon = (type) => {
        switch (type) {
            case 'warning': return <AlertTriangle size={16} color="var(--warning)" />;
            case 'danger': return <TrendingUp size={16} color="var(--danger)" />;
            case 'success': return <ShieldCheck size={16} color="var(--success)" />;
            default: return <Zap size={16} color="var(--primary-color)" />;
        }
    };

    return (
        <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
            <motion.header className="page-header" variants={cardSlideUp} initial="hidden" animate="show">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                        <Bot size={22} />
                    </div>
                    <div>
                        <h1 style={{ marginBottom: 0 }}>Nova AI <span style={{ color: 'var(--accent-purple)' }}>Pro</span></h1>
                        <p style={{ marginTop: '0.1rem' }}>Advanced predictive financial system & assistant</p>
                    </div>
                </div>
            </motion.header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                {/* Chat Panel */}
                <motion.div className="card" variants={cardSlideUp}>
                    <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                            <h3>Assistant Terminal</h3>
                        </div>
                        <span className="badge badge-purple"><Sparkles size={11} /> Next-Gen AI</span>
                    </div>
                    {loading ? (
                        <div className="flex-center" style={{ height: 400 }}>
                            <div className="spinner" />
                        </div>
                    ) : (
                        <AIAssistant balance={balance} transactions={transactions} analysis={analysis} />
                    )}
                </motion.div>

                {/* Info Panel */}
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} variants={cardSlideUp}>

                    {/* Activity Feed Panel */}
                    <div className="card">
                        <div className="card-header">
                            <h3>Activity Feed</h3>
                            <TrendingUp size={15} color="var(--primary-color)" />
                        </div>
                        <div className="card-body">
                            {loading ? <div className="text-sm text-muted">Reading activity...</div> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {analysis?.activityFeed?.length > 0 ? analysis.activityFeed.map((feed, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: '0.6rem', padding: '0.8rem',
                                            background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                                            borderLeft: `2px solid var(--primary-color)`,
                                            fontSize: '0.85rem'
                                        }}>
                                            <div style={{ marginTop: 2 }}>{getInsightIcon(feed.icon)}</div>
                                            <div style={{ lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                                                <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: 'var(--text-primary)' }}>{feed.time}</div>
                                                {feed.text}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-sm text-muted">No recent anomalous activity detected.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Suggestions Panel */}
                    <div className="card">
                        <div className="card-header">
                            <h3>AI Suggestions</h3>
                            <Zap size={15} color="var(--warning)" />
                        </div>
                        <div className="card-body">
                            {loading ? <div className="text-sm text-muted">Analyzing data...</div> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {analysis?.autoActions?.length > 0 ? analysis.autoActions.map((action, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: '0.6rem', padding: '0.8rem',
                                            background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                                            borderLeft: `2px solid var(--accent-purple)`,
                                            fontSize: '0.85rem'
                                        }}>
                                            <div style={{ marginTop: 2 }}><Sparkles size={16} color="var(--accent-purple)" /></div>
                                            <div style={{ lineHeight: 1.4, color: 'var(--text-secondary)' }}>{action}</div>
                                        </div>
                                    )) : (
                                        <div className="text-sm text-muted">Everything looks stable. No critical actions needed.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><h3>Account Snapshot</h3></div>
                        <div className="card-body">
                            <div style={{ marginBottom: '1rem' }}>
                                <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Available Balance</p>
                                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary-color)' }}>${balance.toFixed(2)}</p>
                            </div>
                            {analysis && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Health Score</p>
                                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 700 }}>
                                            <span style={{ color: analysis.score > 70 ? 'var(--success)' : analysis.score > 40 ? 'var(--warning)' : 'var(--danger)' }}>{analysis.score}</span><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Savings Rate</p>
                                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: analysis.savingsRate > 0 ? 'var(--success)' : 'inherit' }}>
                                            {analysis.savingsRate.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(99,179,237,0.08))', border: '1px solid rgba(167,139,250,0.2)' }}>
                        <div className="card-body" style={{ padding: '1.25rem' }}>
                            <p className="text-xs" style={{ color: 'var(--accent-purple)', fontWeight: 600, marginBottom: '0.5rem' }}>✨ Smart Features</p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                                Nova now supports <strong>voice commands</strong> and multi-step actions. Try saying "Transfer $50" using the mic icon!
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AIPage;
