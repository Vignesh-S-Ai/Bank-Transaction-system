import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Lock, Send, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { pageTransition } from '../utils/animations';

const Transfer = () => {
    const [step, setStep] = useState(1);
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [loading, setLoading] = useState(false);

    const shake = () => { setIsShaking(true); setTimeout(() => setIsShaking(false), 400); };

    const handleNext = () => {
        if (step === 1 && receiver.length > 0) setStep(2);
        else if (step === 2 && parseFloat(amount) > 0) setStep(3);
        else shake();
    };

    const executeTransfer = async () => {
        setLoading(true);
        try {
            await api.post('/transactions/transfer', {
                receiverAccountId: parseInt(receiver),
                amount: parseFloat(amount),
            });
            toast.success(`✅ Transferred $${parseFloat(amount).toFixed(2)} to Account #${receiver}`, { theme: 'dark' });
            setStep(4);
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Transfer failed.');
            shake();
        } finally {
            setLoading(false);
        }
    };

    // Step indicator
    const steps = ['Destination', 'Amount', 'Authorize'];
    const StepIndicator = () => (
        <div className="step-indicator">
            {steps.map((s, i) => (
                <motion.div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? '1 1 auto' : 'none' }}>
                    <motion.div
                        className={`step-dot ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}
                        whileHover={{ scale: 1.05 }}
                    >
                        {step > i + 1 ? '✓' : i + 1}
                    </motion.div>
                    {i < steps.length - 1 && (
                        <div className={`step-line ${step > i + 1 ? 'done' : ''}`} />
                    )}
                </motion.div>
            ))}
        </div>
    );

    return (
        <motion.div
            className="dashboard-page flex-center"
            style={{ minHeight: '80vh' }}
            initial="initial" animate="animate" exit="exit"
            variants={pageTransition}
        >
            <motion.div
                className="card"
                style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 2rem' }}
                animate={isShaking ? { x: [-10, 10, -8, 8, 0], transition: { duration: 0.4 } } : {}}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem', color: 'var(--primary-color)' }}>
                        <Send size={22} />
                    </div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700 }}>Send Funds</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Instant NovaBank transfers</p>
                </div>

                {step < 4 && <StepIndicator />}

                <AnimatePresence mode="wait">

                    {/* STEP 1: Receiver */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <label className="form-group" style={{ display: 'block' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Recipient Account ID</span>
                                </label>
                                <div className="input-group mt-2">
                                    <span className="input-prefix"><User size={16} /></span>
                                    <input
                                        autoFocus type="number" placeholder="Enter Account ID"
                                        value={receiver} onChange={e => setReceiver(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleNext()}
                                        style={{ fontSize: '1.1rem', paddingLeft: '2.5rem' }}
                                    />
                                </div>
                            </div>
                            <motion.button
                                className={`btn w-full mt-4 ${receiver ? 'btn-glow' : 'btn-outline'}`}
                                onClick={handleNext}
                                style={{ padding: '0.9rem', fontSize: '0.95rem', fontWeight: 600, marginTop: '1.5rem' }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Continue <ArrowRight size={16} />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* STEP 2: Amount */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}>
                            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                                <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>Sending to Account #{receiver}</div>
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount (USD)</label>
                                <div className="input-group mt-2">
                                    <span className="input-prefix" style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '1.2rem' }}>$</span>
                                    <input
                                        autoFocus type="number" placeholder="0.00"
                                        value={amount} onChange={e => setAmount(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleNext()}
                                        style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", textAlign: 'center', paddingLeft: '2.5rem' }}
                                    />
                                </div>
                            </div>
                            <div className="flex-row mt-4" style={{ marginTop: '1.5rem' }}>
                                <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ padding: '0.9rem 1.25rem' }}>Back</button>
                                <motion.button
                                    className={`btn flex-1 ${parseFloat(amount) > 0 ? 'btn-glow' : 'btn-outline'}`}
                                    onClick={handleNext}
                                    style={{ padding: '0.9rem', fontWeight: 600 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Review Transfer <ArrowRight size={16} />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Confirm */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.2 } }}>
                            <div style={{ background: 'rgba(99,179,237,0.05)', border: '1px solid rgba(99,179,237,0.15)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary-color)' }}>
                                    <Lock size={24} />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Securely sending</p>
                                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.25rem 0' }}>
                                    ${parseFloat(amount).toFixed(2)}
                                </p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>to Account <strong style={{ color: 'var(--primary-color)' }}>#{receiver}</strong></p>
                            </div>
                            <div className="flex-row">
                                <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={loading} style={{ padding: '0.9rem 1.25rem' }}>Back</button>
                                <motion.button
                                    className="btn btn-glow flex-1 flex-center"
                                    onClick={executeTransfer}
                                    disabled={loading}
                                    style={{ padding: '0.9rem', fontWeight: 600 }}
                                    whileHover={{ boxShadow: '0 0 25px rgba(99,179,237,0.4)' }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {loading
                                        ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                        : <><Send size={16} /> Authorize & Send</>
                                    }
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: Success */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', bounce: 0.45 } }}
                            style={{ textAlign: 'center' }}
                        >
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ delay: 0.15, type: 'spring', bounce: 0.5 }}
                                style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-light)', border: '2px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--success)', boxShadow: '0 0 40px var(--glow-success)' }}
                            >
                                <CheckCircle size={40} />
                            </motion.div>
                            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem' }}>Transfer Successful!</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                <strong style={{ color: 'var(--text-main)', fontFamily: "'Space Grotesk', sans-serif" }}>${parseFloat(amount).toFixed(2)}</strong> sent to Account <strong style={{ color: 'var(--primary-color)' }}>#{receiver}</strong>
                            </p>
                            <motion.button
                                className="btn btn-outline w-full"
                                onClick={() => { setStep(1); setReceiver(''); setAmount(''); }}
                                style={{ padding: '0.9rem', fontWeight: 600 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Send Another Transfer
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default Transfer;
