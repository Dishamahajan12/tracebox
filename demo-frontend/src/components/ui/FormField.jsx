import styles from './FormField.module.css';

function FormField({ label, htmlFor, error, hint, required = false, children }) {
  return (
    <label className={styles.field} htmlFor={htmlFor}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.required}>*</span> : null}
      </span>
      {children}
      {hint && !error ? <span className={styles.hint}>{hint}</span> : null}
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}

export default FormField;
