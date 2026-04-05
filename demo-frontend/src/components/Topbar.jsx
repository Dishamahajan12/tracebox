import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import { ROUTE_TITLES } from '../utils/constants';
import { initialsFromName } from '../utils/formatters';
import styles from './Topbar.module.css';

function resolveTitle(pathname) {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }

  if (pathname.startsWith('/projects/')) {
    return 'Project Details';
  }

  if (pathname.startsWith('/tickets/') || pathname.startsWith('/tasks/')) {
    return 'Ticket Details';
  }

  if (pathname.startsWith('/reports/')) {
    return 'Report Details';
  }

  return 'Workspace';
}

function Topbar({ onMenuToggle }) {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  return (
    <header className={styles.topbar}>
      <div className={styles.leading}>
        <button className={styles.menuButton} onClick={onMenuToggle} type="button">
          Menu
        </button>
        <div>
          <span className={styles.kicker}>TraceBox Workspace</span>
          <h1>{resolveTitle(location.pathname)}</h1>
        </div>
      </div>

      <div className={styles.trailing}>
        <div className={styles.profile}>
          <span className={styles.avatar}>{initialsFromName(currentUser?.fullName)}</span>
          <div>
            <strong>{currentUser?.fullName}</strong>
            <p>{currentUser?.email}</p>
          </div>
        </div>

        <Button onClick={() => logout()} size="sm" variant="ghost">
          Logout
        </Button>
      </div>
    </header>
  );
}

export default Topbar;
