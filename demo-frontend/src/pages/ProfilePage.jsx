import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { userService } from '../services/userService';
import { getApiErrorMessage } from '../utils/errors';
import { formatDateTime } from '../utils/formatters';

function ProfilePage() {
  const { currentUser, syncCurrentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(currentUser?.fullName || '');
  }, [currentUser]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const updatedUser = await userService.updateCurrentUser({
        fullName: fullName.trim(),
      });
      syncCurrentUser(updatedUser);
      showSuccess('Profile updated', 'Your account details were saved successfully.');
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to update your profile.');
      setError(message);
      showError('Profile update failed', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        description="Update the core details tied to your authenticated TraceBox account."
        eyebrow="Profile"
        title="My Profile"
      />

      <section className="detail-grid">
        <div className="card card--padded">
          <div className="section-header">
            <div>
              <h2>Account Details</h2>
              <p>Your JWT-backed identity and user record stay in sync with this form.</p>
            </div>
          </div>

          {error ? <div className="inline-message inline-message--error">{error}</div> : null}

          <form className="form-grid form-grid--single" onSubmit={handleSubmit}>
            <InputField
              label="Full name"
              name="fullName"
              onChange={(event) => setFullName(event.target.value)}
              required
              value={fullName}
            />

            <InputField disabled label="Email" name="email" value={currentUser?.email || ''} />

            <div className="form-actions">
              <Button loading={saving} type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        <div className="stack">
          <div className="card card--padded">
            <div className="section-header">
              <div>
                <h2>Access Summary</h2>
                <p>Global role controls which top-level routes and admin areas you can see.</p>
              </div>
            </div>
            <div className="stack">
              <div className="split-row">
                <span>Role</span>
                <StatusBadge value={currentUser?.role} />
              </div>
              <div className="split-row">
                <span>Account status</span>
                <StatusBadge value={currentUser?.active ? 'ACTIVE' : 'ARCHIVED'}>
                  {currentUser?.active ? 'Active' : 'Inactive'}
                </StatusBadge>
              </div>
              <div className="split-row">
                <span>Created</span>
                <strong>{formatDateTime(currentUser?.createdAt)}</strong>
              </div>
              <div className="split-row">
                <span>Last updated</span>
                <strong>{formatDateTime(currentUser?.updatedAt)}</strong>
              </div>
            </div>
          </div>

          <div className="card card--padded">
            <div className="section-header">
              <div>
                <h2>What this page edits</h2>
                <p>The backend currently allows updates to your full name from the frontend profile screen.</p>
              </div>
            </div>
            <span className="pill-note">Email and role remain read-only here</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;
