import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Send, Sparkles, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import useSoundFX from '../utils/sounds';

// ─── Mock AI Response Engine ─────────────────────────────────
const generateResponse = (message, { balance, transactions = [] }) => {
    const msg = message.toLowerCase().trim();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now - 7 * 24 * 3600 * 1000);

    const monthlySpend = transactions
        .filter(t => new Date(t.date) >= monthStart && (t.type === 'WITHDRAWAL' || t.type === 'TRANSFER'))
        .reduce((s, t) => s + t.amount, 0);
    const weeklySpend = transactions
        .filter(t => new Date(t.date) >= weekAgo && (t.type === 'WITHDRAWAL' || t.type === 'TRANSFER'))
        .reduce((s, t) => s + t.amount, 0);
    const monthlyIncome = transactions
        .filter(t => new Date(t.date) >= monthStart && t.type === 'DEPOSIT')
        .reduce((s, t) => s + t.amount, 0);
    const totalTx = transactions.length;
    const lastTx = transactions[0];

    const netBalance = monthlyIncome - monthlySpend;
    const savingsRate = monthlyIncome > 0 ? ((netBalance / monthlyIncome) * 100).toFixed(0) : 0;

    if (msg.includes('balance') || msg.includes('how much do i have') || msg.includes('how much have i got')) {
        return balance < 200
            ? `⚠️ Your current balance is **$${balance.toFixed(2)}**. That's critically low — I'd recommend a deposit as soon as possible.`
            : balance < 500
                ? `Your current balance is **$${balance.toFixed(2)}**. It's a bit low — keep an eye on your spending.`
                : `Your current balance is **$${balance.toFixed(2)}**. You're in good financial shape! 💪`;
    }
    if ((msg.includes('spend') || msg.includes('spent') || msg.includes('spending')) && (msg.includes('month') || msg.includes('monthly'))) {
        return `This month you've spent **$${monthlySpend.toFixed(2)}** on withdrawals and transfers, and received **$${monthlyIncome.toFixed(2)}** in deposits.\n\nNet this month: **${netBalance >= 0 ? '+' : ''}$${netBalance.toFixed(2)}** — ${netBalance >= 0 ? 'positive cashflow! 🎉' : 'you spent more than you earned this month.'}`;
    }
    if ((msg.includes('spend') || msg.includes('spent')) && msg.includes('week')) {
        return weeklySpend > 500
            ? `In the last 7 days you've spent **$${weeklySpend.toFixed(2)}**. That's above average — consider slowing down.`
            : `In the last 7 days you've spent **$${weeklySpend.toFixed(2)}**. Looks reasonable! 👍`;
    }
    if (msg.includes('last') || msg.includes('recent transaction') || msg.includes('latest')) {
        if (!lastTx) return 'No transactions found on your account yet. Make your first deposit to get started!';
        return `Your most recent transaction was a **${lastTx.type}** of **$${lastTx.amount.toFixed(2)}** on ${new Date(lastTx.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`;
    }
    if (msg.includes('how many') || msg.includes('total transactions') || msg.includes('count')) {
        return `You have **${totalTx} transaction${totalTx !== 1 ? 's' : ''}** on record in total. ${totalTx > 20 ? 'Pretty active account! 🔥' : totalTx === 0 ? 'Time to make your first one!' : 'Building up your history.'}`;
    }
    if (msg.includes('income') || msg.includes('deposit') || msg.includes('received') || msg.includes('earned')) {
        return `Your total deposits this month: **$${monthlyIncome.toFixed(2)}**. ${monthlyIncome > monthlySpend ? 'Great — you earned more than you spent! 🎯' : 'Your spending is outpacing income this month.'}`;
    }
    if (msg.includes('save') || msg.includes('saving') || msg.includes('tip') || msg.includes('advice')) {
        return `Based on your activity this month:\n\n• Income: **$${monthlyIncome.toFixed(2)}**\n• Spent: **$${monthlySpend.toFixed(2)}**\n• Savings rate: **${savingsRate}%**\n\n${Number(savingsRate) >= 20 ? '🌟 Excellent! You\'re saving over 20% of income.' : '💡 Tip: Aim to save at least 20% of income. Try using the Budget Tracker on your dashboard!'}`;
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('good')) {
        const hour = now.getHours();
        const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        return `${greet}! 👋 I'm **Nova**, your AI banking assistant. I can help you track spending, check your balance, analyze trends, and give personalized tips. What would you like to know?`;
    }
    if (msg.includes('help') || msg.includes('what can you') || msg.includes('commands')) {
        return `Here's what I can help with:\n\n💰 **Balance** — "What's my balance?"\n📅 **Monthly stats** — "How much did I spend this month?"\n📈 **Weekly trends** — "What did I spend this week?"\n🔄 **Last transaction** — "Show my latest transaction"\n📊 **Transaction count** — "How many transactions do I have?"\n💡 **Savings tips** — "Give me a saving tip"\n\nJust ask naturally!`;
    }
    if (msg.includes('transfer') || msg.includes('send money')) {
        return `To make a transfer, head to the **Transfer** page from the navigation bar. You'll need the recipient's Account ID and the amount. All transfers are instant within NovaBank!`;
    }
    if (msg.includes('budget')) {
        return `The **Budget Tracker** on your dashboard lets you set a monthly spending limit and track your progress in real time. Give it a try — go to the Dashboard and look for the Budget Tracker card!`;
    }
    if (msg.includes('thank')) {
        return `You're welcome! 😊 I'm here anytime you need financial insights. Anything else I can help with?`;
    }
    return `I didn't quite catch that. Try asking about your **balance**, **monthly spending**, **recent transactions**, or type **help** to see everything I can do!`;
};

// ─── Format bold markdown ────────────────────────────────────
const formatMessage = (text) =>
    text.split('\n').map((line, i) => (
        <span key={i} style={{ display: 'block', lineHeight: 1.65 }}>
            {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                j % 2 === 1
                    ? <strong key={j} style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{part}</strong>
                    : part
            )}
        </span>
    ));

// ─── Typing text component — streams chars one by one ────────
const TypingText = ({ text, onDone }) => {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const idxRef = useRef(0);

    useEffect(() => {
        idxRef.current = 0;
        setDisplayed('');
        setDone(false);
        // Vary speed slightly per character for natural feel
        const tick = () => {
            if (idxRef.current >= text.length) {
                setDone(true);
                onDone?.();
                return;
            }
            setDisplayed(text.slice(0, ++idxRef.current));
            // Pause slightly at punctuation
            const ch = text[idxRef.current - 1];
            const delay = '.!?,\n'.includes(ch) ? 60 + Math.random() * 40 : 12 + Math.random() * 10;
            setTimeout(tick, delay);
        };
        const t = setTimeout(tick, 80); // initial delay
        return () => clearTimeout(t);
    }, [text]);

    return (
        <span>
            {formatMessage(displayed)}
            {!done && <span className="cursor-blink" style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--primary-color)', marginLeft: 2, verticalAlign: 'middle', borderRadius: 1 }} />}
        </span>
    );
};

// ─── Suggestion chips ────────────────────────────────────────
const SUGGESTIONS = [
    "What's my balance?",
    "How much did I spend this month?",
    "Show my last transaction",
    "Give me a saving tip",
    "How many transactions do I have?",
    "What did I spend this week?",
];

// ─── Main Component ──────────────────────────────────────────
const AIAssistant = ({ balance, transactions }) => {
    const [messages, setMessages] = useState([
        {
            id: 0, role: 'assistant',
            text: "Hi! I'm **Nova**, your AI banking assistant. ✨\n\nAsk me about your balance, spending trends, or savings tips!",
            typed: true,
        }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [streamId, setStreamId] = useState(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const sfx = useSoundFX();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    const sendMessage = async (text) => {
        const q = (text || input).trim();
        if (!q || typing) return;
        setInput('');
        sfx.click();

        const userMsg = { id: Date.now(), role: 'user', text: q, typed: true };
        setMessages(prev => [...prev, userMsg]);
        setTyping(true);

        // Simulate thinking
        const thinkMs = 600 + Math.random() * 700;
        await new Promise(r => setTimeout(r, thinkMs));

        const reply = generateResponse(q, { balance, transactions });
        const replyId = Date.now() + 1;
        setMessages(prev => [...prev, { id: replyId, role: 'assistant', text: reply, typed: false }]);
        setStreamId(replyId);
        setTyping(false);
    };

    const markTyped = (id) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, typed: true } : m));
        setStreamId(null);
        sfx.success();
    };

    const clearChat = () => {
        setMessages([{
            id: Date.now(), role: 'assistant',
            text: "Chat cleared. I'm still here — what would you like to know?",
            typed: true,
        }]);
    };

    return (
        <div className="ai-assistant-wrapper">
            {/* Suggestion chips */}
            <div className="chat-suggestions">
                {SUGGESTIONS.map(s => (
                    <motion.button
                        key={s}
                        className="chat-suggestion-btn"
                        onClick={() => sendMessage(s)}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={typing}
                    >
                        {s}
                    </motion.button>
                ))}
            </div>

            <div className="chat-container">
                {/* Header */}
                <div className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className="nova-avatar">
                            <Sparkles size={14} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nova AI</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--success)' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                                {typing ? 'Thinking...' : 'Online'}
                            </div>
                        </div>
                    </div>
                    <motion.button
                        className="btn btn-ghost btn-icon-sm"
                        onClick={clearChat}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Clear chat"
                        style={{ color: 'var(--text-muted)', padding: '0.3rem' }}
                    >
                        <X size={15} />
                    </motion.button>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    <AnimatePresence>
                        {messages.map(msg => (
                            <motion.div
                                key={msg.id}
                                className={'chat-bubble ' + msg.role}
                                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                            >
                                <div className={'chat-avatar ' + (msg.role === 'assistant' ? 'ai' : 'user')}>
                                    {msg.role === 'assistant' ? <Bot size={15} /> : <User size={15} />}
                                </div>
                                <div className="chat-bubble-content">
                                    {msg.role === 'assistant' && !msg.typed && msg.id === streamId
                                        ? <TypingText text={msg.text} onDone={() => markTyped(msg.id)} />
                                        : formatMessage(msg.text)
                                    }
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing indicator dots */}
                    {typing && (
                        <motion.div
                            className="chat-bubble assistant"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="chat-avatar ai"><Bot size={15} /></div>
                            <div className="chat-bubble-content">
                                <div className="typing-indicator">
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="chat-input-row">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={typing ? 'Nova is thinking...' : 'Ask Nova anything about your finances…'}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        disabled={typing}
                    />
                    <motion.button
                        className="btn btn-glow btn-icon"
                        onClick={() => sendMessage()}
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(99,179,237,0.4)' }}
                        disabled={!input.trim() || typing}
                    >
                        <Send size={17} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
