import { useState } from 'react';
import { User, Menu as MenuIcon } from 'lucide-react';
import { Drawer } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { dashboardMenuItems } from '../dashboardMenuConfig';
import './DashboardHeader.css';

const DashboardHeader = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = () => {
        // TODO: Implement sign out functionality
        console.log('Sign out clicked');
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        setDrawerOpen(false);
    };

    return (
        <header className="dashboard-header-container">
            <div className="dashboard-header-content">
                <div className="dashboard-header-left mobile-only">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setDrawerOpen(true)}
                    >
                        <MenuIcon size={24} />
                    </button>
                </div>

                <div className="dashboard-header-right">
                    <span className="dashboard-header-username">Super Admin</span>
                    <div className="dashboard-header-profile-icon">
                        <User size={20} />
                    </div>
                    <button
                        className="dashboard-header-signout-btn"
                        onClick={handleSignOut}
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <Drawer
                title={
                    <div className="mobile-drawer-header-logo">
                        <img src="/logo.png" alt="Bimakart" className="mobile-logo-img" />
                    </div>
                }
                placement="left"
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                className="mobile-sidebar-drawer"
                styles={{ body: { padding: 0 } }}
                width={250}
            >
                <div className="mobile-drawer-menu">
                    {dashboardMenuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <div
                                key={item.id}
                                className={`mobile-menu-item ${isActive ? 'active' : ''}`}
                                onClick={() => handleNavigate(item.path)}
                            >
                                <span className="mobile-menu-icon">{item.icon}</span>
                                <span className="mobile-menu-label">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </Drawer>
        </header>
    );
};

export default DashboardHeader;

