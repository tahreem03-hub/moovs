import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ requiredRole = null, children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div>Loading…</div>;   // wait for /me before deciding

    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to={user.role === "admin" ? "/admin" : "/quotes"} replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;