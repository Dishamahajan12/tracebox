import { Navigate, Outlet } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

function PublicOnlyRoute() {
  const { authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Checking your session" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
