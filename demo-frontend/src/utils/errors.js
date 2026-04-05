export function getValidationErrors(error) {
  return error?.response?.data?.validationErrors || {};
}

function getRawApiMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.title ||
    error?.message ||
    ''
  );
}

function isTechnicalApiMessage(message = '') {
  return (
    /no static resource/i.test(message) ||
    /^request failed with status code \d+/i.test(message) ||
    /<html[\s>]/i.test(message) ||
    /whitelabel error page/i.test(message)
  );
}

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const validationErrors = getValidationErrors(error);

  if (Object.keys(validationErrors).length > 0) {
    return Object.values(validationErrors).join(' ');
  }

  const rawMessage = getRawApiMessage(error);

  if (!rawMessage || isTechnicalApiMessage(rawMessage)) {
    return fallback;
  }

  return rawMessage;
}
