import styles from './LoadingSpinner.module.css';

function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default LoadingSpinner;
