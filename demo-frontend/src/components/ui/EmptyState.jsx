import Button from './Button';
import styles from './EmptyState.module.css';

function EmptyState({ title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className={styles.empty}>
      <div className={styles.eyebrow}>TraceBox</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel ? (
        <Button onClick={onAction} to={actionTo} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
