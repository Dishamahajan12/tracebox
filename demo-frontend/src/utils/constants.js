export const APP_NAME = 'TraceBox';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
export const GLOBAL_ROLE_OPTIONS = ['USER', 'ADMIN', 'SUPER_ADMIN'];
export const PROJECT_ASSIGNABLE_ROLE_OPTIONS = ['TESTER', 'MANAGER', 'DEVELOPER', 'DEVOPS', 'SENIOR_MANAGER'];
export const PROJECT_MANAGEABLE_ROLE_OPTIONS = PROJECT_ASSIGNABLE_ROLE_OPTIONS;
export const PROJECT_OWNER_ROLE_OPTIONS = PROJECT_ASSIGNABLE_ROLE_OPTIONS;
export const PROJECT_ACCESS_ROLE_OPTIONS = ['PROJECT_OWNER', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'];
export const TICKET_STATUS_OPTIONS = ['NEW', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
export const TICKET_PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const SORT_ORDER_OPTIONS = ['NEWEST', 'OLDEST'];

// Backward-compatible aliases while the remaining internals finish moving from tasks to tickets.
export const TASK_STATUS_OPTIONS = TICKET_STATUS_OPTIONS;
export const TASK_PRIORITY_OPTIONS = TICKET_PRIORITY_OPTIONS;

export const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/profile': 'Profile',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Admin Users',
};
