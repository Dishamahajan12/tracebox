import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedLayout from '../layouts/ProtectedLayout';
import { useAuth } from '../hooks/useAuth';
import { ADMIN_ROLES } from '../utils/constants';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProfilePage from '../pages/ProfilePage';
import ProjectDetailsPage from '../pages/ProjectDetailsPage';
import ProjectsPage from '../pages/ProjectsPage';
import TaskDetailsPage from '../pages/TaskDetailsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import LoginPage from '../pages/auth/LoginPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import SignupPage from '../pages/auth/SignupPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';

function RootRedirect() {
  const { authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return null;
  }

  return <Navigate replace to={isAuthenticated ? '/dashboard' : '/login'} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootRedirect />} path="/" />

      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<SignupPage />} path="/signup" />
          <Route element={<ForgotPasswordPage />} path="/forgot-password" />
          <Route element={<VerifyOtpPage />} path="/verify-otp" />
          <Route element={<ResetPasswordPage />} path="/reset-password" />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<ProjectsPage />} path="/projects" />
          <Route element={<ProjectDetailsPage />} path="/projects/:projectId" />
          <Route element={<TaskDetailsPage />} path="/tasks/:taskId" />
          <Route element={<ProfilePage />} path="/profile" />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
        <Route element={<ProtectedLayout />}>
          <Route element={<AdminDashboardPage />} path="/admin" />
          <Route element={<AdminUsersPage />} path="/admin/users" />
        </Route>
      </Route>

      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}

export default AppRoutes;
