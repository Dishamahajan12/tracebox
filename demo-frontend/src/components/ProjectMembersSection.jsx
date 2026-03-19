import { useState } from 'react';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import InputField from './ui/InputField';
import SelectField from './ui/SelectField';
import StatusBadge from './ui/StatusBadge';
import { useFormFields } from '../hooks/useFormFields';
import {
  PROJECT_ASSIGNABLE_ROLE_OPTIONS,
  PROJECT_MANAGEABLE_ROLE_OPTIONS,
  PROJECT_OWNER_ROLE_OPTIONS,
} from '../utils/constants';
import { formatDateTime, humanizeEnum, initialsFromName } from '../utils/formatters';
import { canManageProjectMembers, canTransferProjectOwnership } from '../utils/permissions';
import styles from './ProjectMembersSection.module.css';

function ProjectMembersSection({ members, currentUser, projectRole, onAddMember, onUpdateMemberRole, onRemoveMember }) {
  const canManageMembers = canManageProjectMembers(projectRole);
  const canTransferOwnership = canTransferProjectOwnership(projectRole);
  const [draftRoles, setDraftRoles] = useState({});
  const [addingMember, setAddingMember] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const { values, updateField, resetForm } = useFormFields({
    userId: '',
    projectRole: 'MEMBER',
  });

  async function handleAddMember(event) {
    event.preventDefault();

    if (!values.userId.trim()) {
      setSubmitError('User ID is required to add a member.');
      return;
    }

    try {
      setAddingMember(true);
      setSubmitError('');
      await onAddMember({
        userId: Number(values.userId),
        projectRole: values.projectRole,
      });
      resetForm({
        userId: '',
        projectRole: 'MEMBER',
      });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRoleUpdate(member) {
    const nextRole = draftRoles[member.user.id] || member.projectRole;

    if (nextRole === member.projectRole) {
      return;
    }

    try {
      setBusyUserId(member.user.id);
      await onUpdateMemberRole(member.user.id, {
        projectRole: nextRole,
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemove(member) {
    if (!window.confirm(`Remove ${member.user.fullName} from this project?`)) {
      return;
    }

    try {
      setBusyUserId(member.user.id);
      await onRemoveMember(member.user.id);
    } finally {
      setBusyUserId(null);
    }
  }

  if (!members.length) {
    return (
      <div className="card card--padded">
        <EmptyState
          description="Add collaborators once the backend user IDs are known."
          title="No members in this project yet"
        />
      </div>
    );
  }

  return (
    <section className="card card--padded">
      <div className="section-header">
        <div>
          <h2>Project Members</h2>
          <p>Manage project access by role. Viewers stay read-only while admins and owners can coordinate the team.</p>
        </div>
        <span className="pill-note">Your access: {humanizeEnum(projectRole)}</span>
      </div>

      {canManageMembers ? (
        <form className={styles.addForm} onSubmit={handleAddMember}>
          <InputField
            hint="The backend currently expects a numeric user ID."
            label="User ID"
            name="userId"
            onChange={updateField}
            placeholder="Enter user ID"
            required
            value={values.userId}
          />
          <SelectField
            label="Project role"
            name="projectRole"
            onChange={updateField}
            options={PROJECT_ASSIGNABLE_ROLE_OPTIONS.map((role) => ({
              label: humanizeEnum(role),
              value: role,
            }))}
            value={values.projectRole}
          />
          <div className={styles.addAction}>
            <Button loading={addingMember} type="submit">
              Add Member
            </Button>
          </div>
        </form>
      ) : (
        <div className="inline-message">Viewers and members can browse the roster, but only project admins and owners can change it.</div>
      )}

      {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Current Role</th>
              <th>Added</th>
              <th>Role Update</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isCurrentUser = member.user.id === currentUser?.id;
              const disableManagement =
                !canManageMembers ||
                member.projectRole === 'PROJECT_OWNER' ||
                (projectRole === 'PROJECT_ADMIN' && (member.projectRole === 'PROJECT_ADMIN' || isCurrentUser));
              const roleOptions = (canTransferOwnership ? PROJECT_OWNER_ROLE_OPTIONS : PROJECT_MANAGEABLE_ROLE_OPTIONS).map(
                (role) => ({
                  label: humanizeEnum(role),
                  value: role,
                }),
              );

              return (
                <tr key={member.id}>
                  <td>
                    <div className="media-row">
                      <span className="avatar-chip">{initialsFromName(member.user.fullName)}</span>
                      <div>
                        <strong>{member.user.fullName}</strong>
                        <div className="member-meta">{member.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge value={member.projectRole} />
                  </td>
                  <td>{formatDateTime(member.createdAt)}</td>
                  <td>
                    <SelectField
                      label=""
                      name={`project-role-${member.user.id}`}
                      onChange={(event) =>
                        setDraftRoles((currentValues) => ({
                          ...currentValues,
                          [member.user.id]: event.target.value,
                        }))
                      }
                      options={roleOptions}
                      value={draftRoles[member.user.id] || member.projectRole}
                      disabled={disableManagement || busyUserId === member.user.id}
                    />
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button
                        disabled={disableManagement || busyUserId === member.user.id}
                        onClick={() => handleRoleUpdate(member)}
                        size="sm"
                        variant="ghost"
                      >
                        Save
                      </Button>
                      <Button
                        disabled={disableManagement || busyUserId === member.user.id}
                        onClick={() => handleRemove(member)}
                        size="sm"
                        variant="danger"
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ProjectMembersSection;
