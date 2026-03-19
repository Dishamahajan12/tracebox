import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import styles from './ProtectedLayout.module.css';

function ProtectedLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen ? <div className={styles.overlay} onClick={() => setSidebarOpen(false)} role="presentation" /> : null}

      <div className={styles.main}>
        <Topbar onMenuToggle={() => setSidebarOpen((currentState) => !currentState)} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default ProtectedLayout;
