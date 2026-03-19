export function getValidationErrors(error) {
  return error?.response?.data?.validationErrors || {};
}

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const validationErrors = getValidationErrors(error);

  if (Object.keys(validationErrors).length > 0) {
    return Object.values(validationErrors).join(' ');
  }

  return error?.response?.data?.message || error?.message || fallback;
}
