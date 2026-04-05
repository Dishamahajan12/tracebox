import { useEffect, useId, useRef, useState } from 'react';
import FormField from './FormField';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/errors';
import styles from './AsyncAutocompleteField.module.css';

function AsyncAutocompleteField({
  label,
  error,
  hint,
  id,
  name,
  required = false,
  placeholder = 'Search',
  loadOptions,
  value,
  onSelect,
  emptyMessage = 'No matches found.',
  disabled = false,
  loadErrorMessage = 'Unable to load options.',
}) {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  const containerRef = useRef(null);
  const [inputValue, setInputValue] = useState(value?.label || '');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(inputValue, 250);

  useEffect(() => {
    setInputValue(value?.label || '');
  }, [value]);

  useEffect(() => {
    if (!isOpen || disabled) {
      return undefined;
    }

    let isActive = true;

    async function fetchOptions() {
      try {
        setLoading(true);
        setSearchError('');
        const nextOptions = await loadOptions(debouncedSearch.trim());

        if (isActive) {
          setOptions(Array.isArray(nextOptions) ? nextOptions : []);
        }
      } catch (loadError) {
        if (isActive) {
          setSearchError(getApiErrorMessage(loadError, loadErrorMessage));
          setOptions([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchOptions();

    return () => {
      isActive = false;
    };
  }, [debouncedSearch, disabled, isOpen, loadOptions]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function handleInputChange(event) {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    setIsOpen(true);

    if (!nextValue.trim()) {
      onSelect(null);
    } else if (value) {
      onSelect(null);
    }
  }

  function handleOptionSelect(option) {
    onSelect(option);
    setInputValue(option.label);
    setOptions([]);
    setIsOpen(false);
  }

  return (
    <FormField error={error} hint={hint || searchError} htmlFor={inputId} label={label} required={required}>
      <div className={styles.shell} ref={containerRef}>
        <div className={[styles.inputWrap, error ? styles.inputWrapError : ''].filter(Boolean).join(' ')}>
          <input
            autoComplete="off"
            className={styles.input}
            disabled={disabled}
            id={inputId}
            name={name}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            type="text"
            value={inputValue}
          />

          {inputValue ? (
            <button
              className={styles.clear}
              onClick={() => {
                setInputValue('');
                setOptions([]);
                setIsOpen(true);
                onSelect(null);
              }}
              type="button"
            >
              Clear
            </button>
          ) : null}
        </div>

        {isOpen && !disabled ? (
          <div className={styles.panel}>
            {loading ? <div className={styles.state}>Searching...</div> : null}
            {!loading && searchError ? <div className={styles.state}>{searchError}</div> : null}
            {!loading && !searchError && options.length === 0 ? <div className={styles.state}>{emptyMessage}</div> : null}
            {!loading && !searchError && options.length > 0 ? (
              <div className={styles.options} role="listbox">
                {options.map((option) => (
                  <button
                    className={styles.option}
                    key={option.value}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleOptionSelect(option);
                    }}
                    type="button"
                  >
                    <strong>{option.label}</strong>
                    {option.description ? <span>{option.description}</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </FormField>
  );
}

export default AsyncAutocompleteField;
