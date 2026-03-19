import Button from '../components/ui/Button';
import styles from './NotFoundPage.module.css';

function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1>That page wandered off the board.</h1>
        <p>
          The route you requested doesn’t exist in this TraceBox workspace, or you may not have access to it.
        </p>
        <div className={styles.actions}>
          <Button to="/dashboard">Go to Dashboard</Button>
          <Button to="/login" variant="ghost">
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
