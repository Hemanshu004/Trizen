import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps routes that require authentication + optional role.
 *
 * Props:
 *   role   — if provided, only users with this role may access the route
 *   redirectTo — path to redirect unauthenticated users (default: /login)
 */
const ProtectedRoute = ({ role, redirectTo = '/login' }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Role mismatch — redirect to the correct dashboard
  if (role && user.role !== role) {
    const dest = user.role === 'admin' ? '/admin/dashboard' : '/provider/dashboard';
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
