import { AnimatePresence, motion } from 'framer-motion';
import { Activity, BarChart2, Bot, Mic, Send, Sparkles, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AIEngine } from '../utils/ai/engine';
import { aiMemory } from '../utils/ai/memory';
import useSoundFX from '../utils/sounds';

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
        const tick = () => {
            if (idxRef.current >= text.length) {
                setDone(true);
                onDone?.();
                return;
            }
            setDisplayed(text.slice(0, ++idxRef.current));
            const ch = text[idxRef.current - 1];
            // dynamic streaming simulation (faster for long strings)
            const baseDelay = text.length > 100 ? 5 : 15;
            const delay = '.!?,\n'.includes(ch) ? baseDelay + 30 : baseDelay + Math.random() * 5;
            setTimeout(tick, delay);
        };
        const t = setTimeout(tick, 20);
        return () => clearTimeout(t);
    }, [text]);

    return (
        <span>
            {formatMessage(displayed)}
            {!done && <span className="cursor-blink" style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--primary-color)', marginLeft: 2, verticalAlign: 'middle', borderRadius: 1 }} />}
        </span>
    );
};

// ─── Contextual UI Components ────────────────────────────────
const ContextualUI = ({ type, analysis }) => {
    if (!type || !analysis) return null;

    if (type === 'health_score') {
        const color = analysis.score > 70 ? 'var(--success)' : analysis.score > 40 ? 'var(--warning)' : 'var(--danger)';
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="context-ui-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Activity size={16} color={color} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Financial Health Score</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>
                        {analysis.score}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${analysis.score}%`, height: '100%', background: color, transition: 'width 1s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>Out of 100 possible points</div>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (type === 'spending_chart') {
        const { normalized = [], labels = [], values = [] } = analysis.weeklyChart || {};
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="context-ui-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <BarChart2 size={16} color="var(--primary-color)" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Weekly Spending</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', height: 75, alignItems: 'flex-end', position: 'relative' }}>
                    {normalized.map((h, i) => (
                        <div key={i} title={`$${values[i].toFixed(2)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            <div style={{ fontSize: '0.65rem', marginBottom: 4, color: 'var(--text-muted)' }}>{values[i] > 0 ? `$${Math.round(values[i])}` : ''}</div>
                            <div style={{ width: '100%', height: `${h * 100}%`, background: i === 6 ? 'var(--primary-color)' : 'rgba(99,179,237,0.3)', borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height 0.8s ease-out' }} />
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {labels.map((l, idx) => <span key={idx} style={{ flex: 1, textAlign: 'center' }}>{l}</span>)}
                </div>
            </motion.div>
        );
    }
    return null;
};

// ─── Suggestion chips ────────────────────────────────────────
const SUGGESTIONS = [
    "What's my spending DNA?",
    "Predict my future balance",
    "Show spending chart",
    "What is my risk score?",
    "Set savings goal to $500",
    "Any AI auto actions?",
];

// ─── Main Component ──────────────────────────────────────────
const AIAssistant = ({ balance, transactions, analysis }) => {
    const [messages, setMessages] = useState([
        {
            id: 0, role: 'assistant',
            text: "Hi! I'm **Nova**, your advanced AI banking assistant. ✨\n\nI can predict spending, analyze unusual transactions, calculate your health score, or help you with guided actions like transfers.",
            typed: true,
            uiComponent: null
        }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [streamId, setStreamId] = useState(null);
    const [listening, setListening] = useState(false);

    // To keep UI in sync with local engine state
    const [flowState, setFlowState] = useState(null);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const sfx = useSoundFX();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    const handleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support voice input.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setListening(true);
            sfx.click();
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };

        recognition.onerror = () => {
            setListening(false);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognition.start();
    };

    const sendMessage = async (text) => {
        const q = (text || input).trim();
        if (!q || typing) return;
        setInput('');
        sfx.click();

        const userMsg = { id: Date.now(), role: 'user', text: q, typed: true };
        setMessages(prev => [...prev, userMsg]);
        setTyping(true);

        const thinkMs = 400 + Math.random() * 400;
        await new Promise(r => setTimeout(r, thinkMs));

        // Generate response using advanced NLP Engine
        const engine = new AIEngine(balance, transactions);
        const { text: replyText, uiComponent } = await engine.processMessage(q);

        // Sync local UI state pointer for placeholder text
        setFlowState(aiMemory.actionState.flow);

        const replyId = Date.now() + 1;
        setMessages(prev => [...prev, { id: replyId, role: 'assistant', text: replyText, typed: false, uiComponent }]);
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
            text: "Chat cleared. I'm ready for your next request!",
            typed: true,
        }]);
        aiMemory.clearActionState();
        setFlowState(null);
    };

    return (
        <div className="ai-assistant-wrapper">
            <style>{`
            .context-ui-card {
                background: rgba(20, 25, 40, 0.4);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 1rem;
                margin-top: 0.8rem;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .mic-btn.active {
                background: var(--danger);
                color: white;
                animation: pulse 1s infinite;
            }
            `}</style>

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
                                {typing ? 'Analyzing data...' : 'Online & Ready'}
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
                                <div className="chat-bubble-content" style={{ width: '100%' }}>
                                    {msg.role === 'assistant' && !msg.typed && msg.id === streamId
                                        ? <TypingText text={msg.text} onDone={() => markTyped(msg.id)} />
                                        : formatMessage(msg.text)
                                    }
                                    {msg.uiComponent && msg.typed && msg.role === 'assistant' && (
                                        <ContextualUI type={msg.uiComponent} analysis={analysis} />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing indicator dots */}
                    {typing && (
                        <motion.div className="chat-bubble assistant" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="chat-avatar ai"><Bot size={15} /></div>
                            <div className="chat-bubble-content">
                                <div className="typing-indicator">
                                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input row */}
                <div className="chat-input-row" style={{ alignItems: 'center', gap: '0.5rem' }}>
                    <motion.button
                        className={`btn btn-ghost btn-icon-sm mic-btn ${listening ? 'active' : ''}`}
                        onClick={handleVoice}
                        whileTap={{ scale: 0.9 }}
                        title="Voice Input"
                        style={{ padding: '0.5rem', borderRadius: '50%' }}
                    >
                        <Mic size={18} />
                    </motion.button>

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={typing ? 'Nova is analyzing...' : flowState === 'transfer' ? 'Type amount or recipient...' : 'Ask Nova anything...'}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        disabled={typing}
                        style={{ flex: 1 }}
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
