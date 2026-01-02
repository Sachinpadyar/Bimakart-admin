// @ts-check
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideBarComponents from '../SideBarComponents/SideBarComponents';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import './RouteDashboardComponents.css';
import "../DashboardGlobalCss.css"

const RouteDashboardComponents = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleSidebarToggle = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="dashboard-layout">
            <SideBarComponents
                isCollapsed={isSidebarCollapsed}
                onToggle={handleSidebarToggle}
            />
            <div
                className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
            >
                <DashboardHeader />
                <div className="dashboard-main-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default RouteDashboardComponents;
