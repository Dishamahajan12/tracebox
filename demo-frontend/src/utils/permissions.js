import { ADMIN_ROLES } from './constants';

const PROJECT_ROLE_ORDER = {
  VIEWER: 1,
  MEMBER: 2,
  PROJECT_ADMIN: 3,
  PROJECT_OWNER: 4,
};

export function isProjectAccessRole(value) {
  return Object.prototype.hasOwnProperty.call(PROJECT_ROLE_ORDER, value);
}

export function hasAdminAccess(user) {
  return ADMIN_ROLES.includes(user?.role);
}

export function hasProjectRole(currentRole, minimumRole) {
  return (PROJECT_ROLE_ORDER[currentRole] || 0) >= (PROJECT_ROLE_ORDER[minimumRole] || 0);
}

export function canManageProjectTasks(projectRole) {
  return hasProjectRole(projectRole, 'MEMBER');
}

export function canManageProjectMembers(projectRole) {
  return hasProjectRole(projectRole, 'PROJECT_ADMIN');
}

export function canTransferProjectOwnership(projectRole) {
  return projectRole === 'PROJECT_OWNER';
}

export function resolveProjectRole(project, members = [], user) {
  if (project?.currentUserRole) {
    return project.currentUserRole;
  }

  const membership = members.find((member) => member?.user?.id === user?.id);
  return membership?.accessRole || (isProjectAccessRole(membership?.projectRole) ? membership?.projectRole : null);
}

export function canModerateComment(comment, currentUser, projectRole) {
  if (!comment || !currentUser) {
    return false;
  }

  return comment.author?.id === currentUser.id || canManageProjectMembers(projectRole);
}
