import { useLocation } from 'react-router-dom';
import { dashboardMenuItems } from '../dashboardMenuConfig';
import './AllModulesImports.css';

export const AllModulesImports = () => {
    const location = useLocation();
    const path = location.pathname;

    // Find the matching menu item based on the current path
    const activeMenuItem = dashboardMenuItems.find(item => {
        if (item.path === "/dashboard") {
            return path === "/dashboard" || path === "/dashboard/";
        }
        return path.startsWith(item.path);
    });

    // Get the component from the active menu item, or default to dashboard
    const ActiveComponent = activeMenuItem?.component || dashboardMenuItems[0].component;

    return (
        <div className="modules-container">
            <ActiveComponent />
        </div>
    );
};
