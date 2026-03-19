import { motion } from 'framer-motion';
import { Eye, EyeOff, Landmark, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../services/auth.service';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await register({ name, email, password });
            toast.success('Account created! Please sign in 🎉', { theme: 'dark' });
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-bg-blob" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.12), transparent)', top: '-80px', right: '-80px' }} />
            <div className="auth-bg-blob" style={{ background: 'radial-gradient(circle, rgba(99,179,237,0.1), transparent)', bottom: '-100px', left: '-100px', animationDelay: '3s' }} />

            <div className="auth-box">
                <div className="auth-logo">
                    <motion.div
                        initial={{ scale: 0, rotate: 15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        style={{
                            width: 60, height: 60, borderRadius: 18,
                            background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(99,179,237,0.2))',
                            border: '1px solid rgba(52,211,153,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto',
                            boxShadow: '0 0 30px rgba(52,211,153,0.15)',
                        }}
                    >
                        <Landmark size={28} style={{ color: 'var(--success)' }} />
                    </motion.div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>NovaBank</h2>
                    <p className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>Create your free account</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <h2>Get Started</h2>
                    <p className="subtitle">Join thousands managing finances smarter</p>

                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-group mt-2">
                            <span className="input-prefix"><User size={16} /></span>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-group mt-2">
                            <span className="input-prefix"><Mail size={16} /></span>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@example.com" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-group mt-2">
                            <span className="input-prefix"><Lock size={16} /></span>
                            <input
                                type={showPw ? 'text' : 'password'} value={password}
                                onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" minLength="6"
                            />
                            <button type="button" className="input-suffix" onClick={() => setShowPw(!showPw)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        type="submit" className="btn btn-primary w-full" disabled={loading}
                        style={{ padding: '0.875rem', fontSize: '0.95rem', marginTop: '0.25rem', background: 'linear-gradient(135deg, #10b981, #34d399)', boxShadow: '0 4px 15px rgba(52,211,153,0.25)' }}
                        whileTap={{ scale: 0.98 }} whileHover={{ boxShadow: '0 0 30px rgba(52,211,153,0.4)' }}
                    >
                        {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
                    </motion.button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
