export function humanizeEnum(value) {
  if (!value) {
    return 'Unknown';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatDate(dateValue, options = {}) {
  if (!dateValue) {
    return 'Not set';
  }

  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(dateValue) {
  if (!dateValue) {
    return 'Unknown';
  }

  return new Date(dateValue).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initialsFromName(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function sanitizeProjectKey(value = '') {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export function truncateText(value = '', maxLength = 120) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export function formatFileSize(sizeInBytes) {
  if (typeof sizeInBytes !== 'number' || Number.isNaN(sizeInBytes) || sizeInBytes < 0) {
    return 'Unknown size';
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function extractFilename(value = '') {
  if (!value) {
    return '';
  }

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const filenameMatch = value.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || '';
}
