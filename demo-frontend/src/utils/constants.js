export const APP_NAME = 'TraceBox';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
export const GLOBAL_ROLE_OPTIONS = ['USER', 'ADMIN', 'SUPER_ADMIN'];
export const PROJECT_ASSIGNABLE_ROLE_OPTIONS = ['PROJECT_ADMIN', 'MEMBER', 'VIEWER'];
export const PROJECT_MANAGEABLE_ROLE_OPTIONS = ['PROJECT_ADMIN', 'MEMBER', 'VIEWER'];
export const PROJECT_OWNER_ROLE_OPTIONS = ['PROJECT_OWNER', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'];
export const TASK_STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
export const TASK_PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/profile': 'Profile',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Admin Users',
};
