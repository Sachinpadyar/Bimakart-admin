// @ts-check
import { Routes, Route, Navigate} from "react-router-dom";
import "./App.css"
import RouteDashboardComponents from "./components/DashboardAllComponents/RouteDashboardComponents/RouteDashboardComponents";
import { AllModulesImports } from "./components/DashboardAllComponents/AllModulesImports/AllModulesImports";

function App() {
  // const location = useLocation();
  // const isDashboardRoute = location.pathname.toLowerCase().startsWith("/dashboard");

  return (
    <>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/dashboard/product-listing" replace />} />
        <Route path="/dashboard/*" element={<RouteDashboardComponents />}>
          <Route path="*" element={<AllModulesImports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </>
  );
}

export default App;
