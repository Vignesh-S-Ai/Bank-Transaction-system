import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ onLogout }) => {
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
