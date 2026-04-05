import { useEffect, useMemo, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';
import StatusBadge from './ui/StatusBadge';
import { userService } from '../services/userService';
import { getApiErrorMessage } from '../utils/errors';
import { formatDateTime, initialsFromName, humanizeEnum } from '../utils/formatters';
import styles from './UserProfileTrigger.module.css';

function UserProfileTrigger({ user, children, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  const displayName = useMemo(() => profile?.fullName || user?.fullName || 'Unknown user', [profile, user]);
  const profileUrl = profile?.profileUrl || user?.profileUrl;
  const isActive =
    typeof profile?.active === 'boolean' ? profile.active : typeof user?.active === 'boolean' ? user.active : null;

  useEffect(() => {
    if (!isOpen || !user?.id || profile) {
      return undefined;
    }

    let isActive = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError('');
        const response = await userService.getUser(user.id);

        if (isActive) {
          setProfile(response);
        }
      } catch (loadError) {
        if (isActive) {
          setError(getApiErrorMessage(loadError, 'Unable to load this profile.'));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [isOpen, profile, user]);

  if (!user?.id) {
    return <span>{children || displayName}</span>;
  }

  return (
    <>
      <button className={[styles.trigger, className].filter(Boolean).join(' ')} onClick={() => setIsOpen(true)} type="button">
        {children || displayName}
      </button>

      <Modal
        description="Quick user context for collaboration without leaving the current workflow."
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="User Profile"
      >
        {loading ? (
          <div className={styles.loadingState}>
            <LoadingSpinner label="Loading profile" />
          </div>
        ) : (
          <div className={styles.profileCard}>
            <div className={styles.header}>
              <span className="avatar-chip">{initialsFromName(displayName)}</span>
              <div className={styles.headerText}>
                <h3>{displayName}</h3>
                <p>{profile?.email || user?.email || 'Email not available'}</p>
              </div>
            </div>

            {error ? <div className="inline-message inline-message--error">{error}</div> : null}

            <div className="detail-list">
              <div>
                <dt>Role</dt>
                <dd>{profile?.role ? <StatusBadge value={profile.role}>{humanizeEnum(profile.role)}</StatusBadge> : 'Unknown'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge value={isActive === false ? 'ARCHIVED' : isActive === true ? 'ACTIVE' : undefined}>
                    {isActive === null ? 'Unknown' : isActive ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(profile?.createdAt)}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatDateTime(profile?.updatedAt)}</dd>
              </div>
            </div>

            {profileUrl ? (
              <div className="form-actions">
                <Button href={profileUrl} rel="noreferrer" target="_blank" variant="ghost">
                  Open Full Profile
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </>
  );
}

export default UserProfileTrigger;
