import { motion } from 'framer-motion';
import { ArrowLeftRight, Bot, Landmark, LayoutDashboard, LogOut, Send } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
    { path: '/', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { path: '/transactions', icon: <ArrowLeftRight size={17} />, label: 'Transactions' },
    { path: '/transfer', icon: <Send size={17} />, label: 'Transfer' },
    { path: '/assistant', icon: <Bot size={17} />, label: 'AI Nova' },
];

const Navbar = ({ onLogout }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleLogout = () => { onLogout(); navigate('/login'); };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <motion.div
                        whileHover={{ rotate: 12, scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(99,179,237,0.2), rgba(167,139,250,0.2))',
                            border: '1px solid rgba(99,179,237,0.25)',
                            padding: '0.5rem', borderRadius: 12,
                            display: 'flex', alignItems: 'center',
                        }}
                    >
                        <Landmark size={20} style={{ color: 'var(--primary-color)' }} />
                    </motion.div>
                    <span style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        background: 'linear-gradient(90deg, var(--text-main), var(--accent-purple))',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        NovaBank
                    </span>
                </Link>

                {/* Nav Links */}
                <div className="navbar-links">
                    {NAV_ITEMS.map(item => {
                        const isActive = pathname === item.path;
                        return (
                            <motion.div key={item.path} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
                                <Link
                                    to={item.path}
                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                    style={item.path === '/assistant' && !isActive ? {
                                        background: 'rgba(167,139,250,0.05)',
                                        border: '1px solid rgba(167,139,250,0.1)',
                                        color: 'var(--accent-purple)',
                                    } : {}}
                                >
                                    {item.icon}
                                    <span className="nav-text">{item.label}</span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Right Actions */}
                <div className="navbar-actions">
                    {/* Profile avatar */}
                    <Link to="/profile">
                        <motion.div
                            whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(99,179,237,0.35)' }}
                            style={{
                                width: 38, height: 38, borderRadius: '50%',
                                border: '2px solid rgba(99,179,237,0.25)',
                                overflow: 'hidden', cursor: 'pointer',
                                transition: 'box-shadow 0.2s',
                            }}
                        >
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=NovaBank&backgroundColor=63b3ed"
                                alt="Profile" width="38" height="38"
                                style={{ display: 'block' }}
                            />
                        </motion.div>
                    </Link>

                    {/* Logout */}
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.45rem 0.875rem', borderRadius: 10,
                            background: 'rgba(248,113,113,0.08)',
                            border: '1px solid rgba(248,113,113,0.2)',
                            color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                        }}
                    >
                        <LogOut size={16} />
                        <span className="nav-text">Logout</span>
                    </motion.button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
