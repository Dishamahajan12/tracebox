import styles from './ToastViewport.module.css';

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className={styles.viewport} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className={[styles.toast, styles[toast.variant]].join(' ')} key={toast.id}>
          <div>
            <strong>{toast.title}</strong>
            {toast.message ? <p>{toast.message}</p> : null}
          </div>
          <button className={styles.close} onClick={() => onDismiss(toast.id)} type="button">
            x
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastViewport;
