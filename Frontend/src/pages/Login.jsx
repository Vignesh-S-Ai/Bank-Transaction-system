import { motion } from 'framer-motion';
import { Eye, EyeOff, Landmark, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../services/auth.service';
import { useBehaviorTracker } from '../utils/useBehaviorTracker';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    // OTP State
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [otp, setOtp] = useState('');
    const [tempToken, setTempToken] = useState('');

    const navigate = useNavigate();

    // ─── BEHAVIORAL TRACKING ───
    const { getBehavioralData, resetTracking } = useBehaviorTracker();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const behavioralData = getBehavioralData();

        try {
            const resData = await login(email, password, behavioralData);

            if (resData.verification_required) {
                setTempToken(resData.tempToken);
                setIsOtpStep(true);
                toast.info('Security verification required. Please check your email.', { theme: 'dark' });
                resetTracking();
                return;
            }

            onLogin(resData.token);
            toast.success('Welcome back! 🎉', { theme: 'dark' });
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.');
            resetTracking();
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const resData = await verifyOtp(tempToken, otp);
            onLogin(resData.token);
            toast.success('Identity verified! 🎉', { theme: 'dark' });
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid verification code.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="auth-container">
            <div className="auth-bg-blob" style={{ background: 'radial-gradient(circle, rgba(99,179,237,0.15), transparent)', top: '-100px', left: '-100px' }} />
            <div className="auth-bg-blob" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.12), transparent)', bottom: '-80px', right: '-80px', animationDelay: '4s' }} />

            <div className="auth-box">
                <div className="auth-logo">
                    <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        style={{
                            width: 60, height: 60, borderRadius: 18,
                            background: 'linear-gradient(135deg, rgba(99,179,237,0.2), rgba(167,139,250,0.2))',
                            border: '1px solid rgba(99,179,237,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto',
                            boxShadow: '0 0 30px rgba(99,179,237,0.2)',
                        }}
                    >
                        <Landmark size={28} style={{ color: 'var(--primary-color)' }} />
                    </motion.div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>NovaBank</h2>
                    <p className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>Secure Financial Platform</p>
                </div>

                {isOtpStep ? (
                    <form onSubmit={handleOtpSubmit} className="auth-form">
                        <h2>Verification Required</h2>
                        <p className="subtitle">Enter the 6-digit code sent to your email.</p>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label>Verification Code</label>
                            <div className="input-group mt-2">
                                <span className="input-prefix"><ShieldAlert size={16} /></span>
                                <input
                                    type="text" value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    maxLength={6}
                                    required placeholder="123456"
                                    style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                                />
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                            style={{ padding: '0.875rem', fontSize: '0.95rem', marginTop: '1.5rem' }}
                            whileTap={{ scale: 0.98 }}
                            whileHover={{ boxShadow: '0 0 30px rgba(99,179,237,0.35)' }}
                        >
                            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Verify Identity'}
                        </motion.button>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setIsOtpStep(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <h2>Welcome Back</h2>
                        <p className="subtitle">Sign in to your account</p>

                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-group mt-2">
                                <span className="input-prefix"><Mail size={16} /></span>
                                <input
                                    type="email" value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-group mt-2">
                                <span className="input-prefix"><Lock size={16} /></span>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required placeholder="••••••••"
                                />
                                <button type="button" className="input-suffix" onClick={() => setShowPw(!showPw)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                            style={{ padding: '0.875rem', fontSize: '0.95rem', marginTop: '0.25rem' }}
                            whileTap={{ scale: 0.98 }}
                            whileHover={{ boxShadow: '0 0 30px rgba(99,179,237,0.35)' }}
                        >
                            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
                        </motion.button>
                    </form>
                )}

                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Create one free</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;

