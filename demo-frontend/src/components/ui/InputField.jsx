import FormField from './FormField';
import styles from './FormField.module.css';

function InputField({ label, error, hint, id, required, className = '', ...rest }) {
  return (
    <FormField error={error} hint={hint} htmlFor={id || rest.name} label={label} required={required}>
      <input
        className={[styles.control, error ? styles.controlError : '', className].filter(Boolean).join(' ')}
        id={id || rest.name}
        {...rest}
      />
    </FormField>
  );
}

export default InputField;
