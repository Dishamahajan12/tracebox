import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const { authLoading, currentUser, isAuthenticated } = useAuth();

  if (authLoading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Loading your workspace" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(currentUser?.role)) {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
