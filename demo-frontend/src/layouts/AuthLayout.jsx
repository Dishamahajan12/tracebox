import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

function AuthLayout() {
  return (
    <div className={styles.layout}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>TraceBox</span>
        <h1>Ship clarity into every sprint.</h1>
        <p>
          Plan work, track delivery, and keep teams aligned with a calm, modern Jira-like workspace.
        </p>

        <div className={styles.featureList}>
          <article>
            <strong>Projects that stay readable</strong>
            <span>Structured dashboards, role-aware controls, and fast-moving ticket views.</span>
          </article>
          <article>
            <strong>Authentication that persists</strong>
            <span>JWT sessions, protected routes, and clean recovery flows.</span>
          </article>
          <article>
            <strong>Admin controls when you need them</strong>
            <span>Keep normal users focused while admins manage the wider workspace.</span>
          </article>
        </div>
      </section>

      <main className={styles.panel}>
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;
