import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasAdminAccess } from '../utils/permissions';
import { humanizeEnum, initialsFromName } from '../utils/formatters';
import styles from './Sidebar.module.css';

function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const isAdmin = hasAdminAccess(currentUser);
  const navigationItems = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Projects', to: '/projects' },
    { label: 'Profile', to: '/profile' },
  ];

  if (isAdmin) {
    navigationItems.push({ label: 'Admin', to: '/admin' });
  }

  return (
    <aside className={[styles.sidebar, isOpen ? styles.open : ''].join(' ')}>
      <div className={styles.brand}>
        <div className={styles.logo}>TB</div>
        <div>
          <strong>TraceBox</strong>
          <p>Project clarity for fast-moving teams</p>
        </div>
        <button className={styles.close} onClick={onClose} type="button">
          x
        </button>
      </div>

      <nav className={styles.nav}>
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) => [styles.link, isActive ? styles.linkActive : ''].join(' ')}
            key={item.to}
            onClick={onClose}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userBadge}>
          <span className={styles.avatar}>{initialsFromName(currentUser?.fullName)}</span>
          <div>
            <strong>{currentUser?.fullName}</strong>
            <p>{humanizeEnum(currentUser?.role)}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
