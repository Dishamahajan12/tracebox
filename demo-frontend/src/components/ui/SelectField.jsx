import FormField from './FormField';
import styles from './FormField.module.css';

function SelectField({ label, error, hint, id, required, options = [], placeholder, ...rest }) {
  return (
    <FormField error={error} hint={hint} htmlFor={id || rest.name} label={label} required={required}>
      <select
        className={[styles.control, error ? styles.controlError : ''].filter(Boolean).join(' ')}
        id={id || rest.name}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => {
          const normalizedOption = typeof option === 'string' ? { label: option, value: option } : option;

          return (
            <option key={normalizedOption.value} value={normalizedOption.value}>
              {normalizedOption.label}
            </option>
          );
        })}
      </select>
    </FormField>
  );
}

export default SelectField;
