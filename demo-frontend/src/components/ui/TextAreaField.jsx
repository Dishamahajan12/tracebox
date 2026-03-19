import FormField from './FormField';
import styles from './FormField.module.css';

function TextAreaField({ label, error, hint, id, required, rows = 5, ...rest }) {
  return (
    <FormField error={error} hint={hint} htmlFor={id || rest.name} label={label} required={required}>
      <textarea
        className={[styles.control, styles.textarea, error ? styles.controlError : ''].filter(Boolean).join(' ')}
        id={id || rest.name}
        rows={rows}
        {...rest}
      />
    </FormField>
  );
}

export default TextAreaField;
