import "./SideBarComponents.css";
import { Link, useLocation } from "react-router-dom";
import { dashboardMenuItems } from '../dashboardMenuConfig';

interface SideBarComponentsProps {
    isCollapsed: boolean;
}

const SideBarComponents: React.FC<SideBarComponentsProps> = ({ isCollapsed }) => {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === "/dashboard") {
            return location.pathname === "/dashboard" || location.pathname === "/dashboard/";
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!isCollapsed && (
                    <div className="sidebar-logo">
                        <img src="/logo.png" alt="Bimakart" className="logo-img" />
                    </div>
                )}
                {isCollapsed && (
                    <div className="sidebar-logo-collapsed">
                        <img src="/logo.png" alt="Bimakart" className="logo-img-small" />
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                <ul className="sidebar-menu">
                    {dashboardMenuItems.map((item) => (
                        <li key={item.id}>
                            <Link to={item.path} className="sidebar-link">
                                <button
                                    className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <span className="menu-icon">{item.icon}</span>
                                    {!isCollapsed && <span className="menu-label">{item.label}</span>}
                                </button>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default SideBarComponents;
