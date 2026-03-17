import { ArrowLeftRight, Landmark, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    const navClass = (path) => {
        return `nav-link ${location.pathname === path ? 'active' : ''}`;
    };

    return (
        <nav className="navbar">
            <div className="navbar-container container">
                <Link to="/" className="navbar-logo">
                    <Landmark className="icon-primary" size={28} />
                    <span>NovaBank</span>
                </Link>
                <div className="navbar-links">
                    <Link to="/" className={navClass('/')}>
                        <LayoutDashboard size={18} />
                        <span className="nav-text">Dashboard</span>
                    </Link>
                    <Link to="/transactions" className={navClass('/transactions')}>
                        <ArrowLeftRight size={18} />
                        <span className="nav-text">Transactions</span>
                    </Link>
                </div>
                <div className="navbar-actions">
                    <button className="btn btn-ghost btn-danger flex-center" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span className="nav-text" style={{ marginLeft: '6px' }}>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
