import { useState } from 'react';

export function useFormFields(initialState) {
  const [values, setValues] = useState(initialState);

  function updateField(eventOrName, nextValue) {
    if (typeof eventOrName === 'string') {
      setValues((currentValues) => ({
        ...currentValues,
        [eventOrName]: nextValue,
      }));
      return;
    }

    const event = eventOrName;
    const { name, value, type, checked } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function resetForm(nextState = initialState) {
    setValues(nextState);
  }

  return {
    values,
    setValues,
    updateField,
    resetForm,
  };
}
