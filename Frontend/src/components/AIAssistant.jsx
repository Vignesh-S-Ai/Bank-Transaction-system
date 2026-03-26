import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Mic, Send, Sparkles, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sendAIChat } from '../services/ai.service';
import { aiMemory } from '../utils/ai/memory';
import useSoundFX from '../utils/sounds';

// ─── Format markdown — Bold & Lists ─────────────────────────
const formatMessage = (text) =>
    text.split('\n').map((line, i) => (
        <span key={i} style={{ display: 'block', lineHeight: 1.6, marginBottom: line.startsWith('-') ? '0.2rem' : '0.4rem' }}>
            {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                j % 2 === 1
                    ? <strong key={j} style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{part}</strong>
                    : part
            )}
        </span>
    ));

// ─── ChatGPT-style Streaming Typing Component ───────────────
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

            // Speed: 10-20ms per character + punctuation pauses
            const ch = text[idxRef.current - 1];
            let delay = 12 + Math.random() * 8;
            if ('.!?'.includes(ch)) delay += 150;
            else if (',;'.includes(ch)) delay += 70;

            setTimeout(tick, delay);
        };

        const t = setTimeout(tick, 50);
        return () => clearTimeout(t);
    }, [text]);

    return (
        <span>
            {formatMessage(displayed)}
            {!done && <span className="cursor-blink" style={{ display: 'inline-block', width: 2, height: '1.1em', background: 'var(--primary-color)', marginLeft: 3, verticalAlign: 'middle' }} />}
        </span>
    );
};

// ─── Main Assistant Component ───────────────────────────────
const AIAssistant = ({ balance, transactions, analysis }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [streamId, setStreamId] = useState(null);
    const [listening, setListening] = useState(false);

    const bottomRef = useRef(null);
    const sfx = useSoundFX();

    // 🧠 Memory Integration: Restore last 10 messages on mount
    useEffect(() => {
        const history = aiMemory.history.slice(-10).map((m, i) => ({
            id: i,
            role: m.role,
            text: m.text,
            typed: true
        }));

        if (history.length === 0) {
            setMessages([{
                id: 0,
                role: 'assistant',
                text: "Hello! I'm **Nova**, your financial co-pilot. I can simulate scenarios, track spending patterns, or give you advice on reaching your goals. How are you doing today?",
                typed: true
            }]);
        } else {
            setMessages(history);
        }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    const sendMessage = async (text) => {
        const q = (text || input).trim();
        if (!q || typing) return;
        setInput('');
        sfx.click();

        // 1. Add User Message & Save to Memory
        const userMsg = { id: Date.now(), role: 'user', text: q, typed: true };
        setMessages(prev => [...prev, userMsg]);
        aiMemory.addMessage('user', q);
        setTyping(true);

        try {
            // 2. Optimized Request: Layer 1 (Local/Sim) and Layer 2 (Gemini) happen on Backend
            const res = await sendAIChat(q, aiMemory.history.slice(-10), {
                balance,
                transactions: transactions.slice(0, 10),
                monthlyIncome: analysis.monthlyIncome,
                monthlySpend: analysis.monthlySpend
            });

            const replyText = res?.reply || "I'm having trouble connecting right now. Please try again.";

            const replyId = Date.now() + 1;
            setMessages(prev => [...prev, { id: replyId, role: 'assistant', text: replyText, typed: false }]);
            setStreamId(replyId);
            aiMemory.addMessage('assistant', replyText);

        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                text: "⚠️ **Nova is offline.** Ensure your Gemini API key is valid in the backend .env file.",
                typed: true
            }]);
        } finally {
            setTyping(false);
        }
    };

    const markTyped = (id) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, typed: true } : m));
        setStreamId(null);
        sfx.success();
    };

    const clearChat = () => {
        aiMemory.clearMemory();
        setMessages([{
            id: Date.now(), role: 'assistant',
            text: "Memory cleared. I'm ready for a fresh start!",
            typed: true
        }]);
    };

    return (
        <div className="ai-assistant-wrapper">
            <div className="chat-container">
                <div className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div className="nova-avatar"><Sparkles size={16} /></div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>Nova Assistant</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div className="status-dot-pulse" /> {typing ? 'Thinking...' : 'Ready'}
                            </div>
                        </div>
                    </div>
                    <button onClick={clearChat} className="btn-icon-sm" title="Clear Memory"><X size={16} /></button>
                </div>

                <div className="chat-messages">
                    <AnimatePresence>
                        {messages.map(msg => (
                            <motion.div
                                key={msg.id}
                                className={`chat-bubble ${msg.role}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className={`chat-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
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
                    {typing && (
                        <div className="chat-bubble assistant">
                            <div className="chat-avatar ai"><Bot size={16} /></div>
                            <div className="chat-bubble-content"><div className="typing-dots"><span /><span /><span /></div></div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="chat-input-row">
                    <input
                        type="text"
                        placeholder="Try: 'If I spend 5000 will my score drop?'"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        disabled={typing}
                    />
                    <button onClick={() => sendMessage()} disabled={!input.trim() || typing} className="btn-send">
                        <Send size={18} />
                    </button>
                    <button onClick={() => { }} className="btn-mic"><Mic size={18} /></button>
                </div>
            </div>

            <style>{`
                .status-dot-pulse { width: 6px; height: 6px; background: var(--success); border-radius: 50%; box-shadow: 0 0 8px var(--success); animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                .cursor-blink { animation: blink 0.8s infinite; }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                .typing-dots { display: flex; gap: 4px; padding: 4px 0; }
                .typing-dots span { width: 4px; height: 4px; background: var(--text-muted); border-radius: 50%; animation: dots 1.4s infinite; }
                .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
                .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes dots { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            `}</style>
        </div>
    );
};

export default AIAssistant;
