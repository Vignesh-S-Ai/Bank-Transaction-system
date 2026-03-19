import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import CursorGlow from './components/CursorGlow';
import Layout from './components/Layout';
import ParticleBackground from './components/ParticleBackground';
import AIPage from './pages/AIPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Transactions from './pages/Transactions';
import Transfer from './pages/Transfer';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) setIsAuthenticated(true);
        setLoading(false);
    }, []);

    const handleLogin = (token) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
    };

    const ProtectedRoute = ({ children }) => {
        if (loading) return null;
        if (!isAuthenticated) return <Navigate to="/login" replace />;
        return children;
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(99,179,237,0.15)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading NovaBank…</span>
        </div>
    );

    return (
        <>
            {/* ── Global ambient effects – rendered behind all UI ── */}
            <ParticleBackground />
            <CursorGlow />

            <ToastContainer
                position="top-right"
                autoClose={3500}
                hideProgressBar={false}
                theme="dark"
                toastStyle={{ background: 'rgba(17,29,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, backdropFilter: 'blur(16px)' }}
            />
            <BrowserRouter>
                <AnimatePresence mode="wait">
                    <Routes>
                        <Route path="/login" element={<Login onLogin={handleLogin} />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<ProtectedRoute><Layout onLogout={handleLogout} /></ProtectedRoute>}>
                            <Route index element={<Dashboard />} />
                            <Route path="transactions" element={<Transactions />} />
                            <Route path="transfer" element={<Transfer />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="assistant" element={<AIPage />} />
                        </Route>
                    </Routes>
                </AnimatePresence>
            </BrowserRouter>
        </>
    );
};

export default App;
