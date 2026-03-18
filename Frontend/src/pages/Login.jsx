import { Landmark } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/auth.service';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(email, password);
            onLogin(response.data.token);
            navigate('/');
        } catch (err) {
            alert('Login failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box fade-in">
                <div className="auth-logo">
                    <Landmark size={48} className="icon-primary" />
                    <h2>NovaBank</h2>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    <h2>Welcome Back</h2>
                    <p className="subtitle">Login to your checking account</p>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Sign In</button>
                </form>
                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
