import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import SelectField from '../../components/ui/SelectField';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { roleService } from '../../services/roleService';
import { GLOBAL_ROLE_OPTIONS } from '../../utils/constants';
import { getApiErrorMessage } from '../../utils/errors';
import { formatDateTime, humanizeEnum } from '../../utils/formatters';

function AdminUsersPage() {
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [roleOptions, setRoleOptions] = useState(
    GLOBAL_ROLE_OPTIONS.map((role) => ({
      label: humanizeEnum(role),
      value: role,
    })),
  );
  const [search, setSearch] = useState('');
  const [savingUserId, setSavingUserId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        setLoading(true);
        setError('');

        const [userData, roleData] = await Promise.all([
          adminService.getUsers(),
          roleService.getRoles().catch(() => []),
        ]);

        if (!isMounted) {
          return;
        }

        setUsers(userData || []);

        if (roleData?.length) {
          setRoleOptions(
            roleData.map((role) => ({
              label: humanizeEnum(role.name),
              value: role.name,
            })),
          );
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, 'Unable to load admin users.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = users.filter((user) => {
    if (!search.trim()) {
      return true;
    }

    const query = search.trim().toLowerCase();
    return user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
  });

  function updateLocalUser(userId, key, value) {
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === userId ? { ...user, [key]: value } : user)),
    );
  }

  async function handleSave(user) {
    try {
      setSavingUserId(user.id);
      const updatedUser = await adminService.updateUser(user.id, {
        role: user.role,
        active: user.active,
      });
      setUsers((currentUsers) => currentUsers.map((item) => (item.id === user.id ? updatedUser : item)));
      showSuccess('User updated', `${updatedUser.fullName}'s admin settings were saved.`);
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to update this user.');
      showError('User update failed', message);
    } finally {
      setSavingUserId(null);
    }
  }

  if (loading) {
    return (
      <div className="screen-center">
        <LoadingSpinner label="Loading users" />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        description="Change global roles and activation state for the workspace from a single responsive table."
        eyebrow="Admin"
        title="User Management"
      />

      <div className="card card--padded">
        <InputField
          label="Search users"
          name="searchUsers"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          value={search}
        />
      </div>

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="stack--sm">
                    <strong>{user.fullName}</strong>
                    <span className="muted">{user.email}</span>
                  </div>
                </td>
                <td>
                  <SelectField
                    label=""
                    name={`role-${user.id}`}
                    onChange={(event) => updateLocalUser(user.id, 'role', event.target.value)}
                    options={roleOptions}
                    value={user.role}
                  />
                </td>
                <td>
                  <div className="stack--sm">
                    <StatusBadge value={user.active ? 'ACTIVE' : 'ARCHIVED'}>
                      {user.active ? 'Active' : 'Inactive'}
                    </StatusBadge>
                    <label className="pill-note">
                      <input
                        checked={Boolean(user.active)}
                        onChange={(event) => updateLocalUser(user.id, 'active', event.target.checked)}
                        type="checkbox"
                      />
                      Active user
                    </label>
                  </div>
                </td>
                <td>{formatDateTime(user.createdAt)}</td>
                <td>{formatDateTime(user.updatedAt)}</td>
                <td>
                  <Button
                    loading={savingUserId === user.id}
                    onClick={() => handleSave(user)}
                    size="sm"
                    variant="secondary"
                  >
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersPage;
