import { Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useContinuousAuth } from '../utils/useContinuousAuth';
import Navbar from './Navbar';

const Layout = ({ onLogout }) => {
    const navigate = useNavigate();

    // 🔒 Continuous Post-Login Authentication 
    useContinuousAuth((anomalyMessage) => {
        toast.error(anomalyMessage || 'Security Anomaly Detected. Logging out.', {
            autoClose: 10000,
            theme: 'dark'
        });
        onLogout();
        navigate('/login', { replace: true });
    });

    return (
        <div className="app-layout">
            <Navbar onLogout={onLogout} />
            <main className="main-content container">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
