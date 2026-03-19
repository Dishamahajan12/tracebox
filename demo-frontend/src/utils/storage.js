const AUTH_STORAGE_KEY = 'tracebox.auth';
const LEGACY_TOKEN_STORAGE_KEY = 'token';
const LEGACY_USER_STORAGE_KEY = 'user';
const PASSWORD_RESET_STORAGE_KEY = 'tracebox.password-reset';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function parseJson(value, fallbackValue) {
  if (!value) {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallbackValue;
  }
}

export function loadStoredAuth() {
  const storage = getStorage();

  if (!storage) {
    return { token: '', user: null };
  }

  const structuredAuth = parseJson(storage.getItem(AUTH_STORAGE_KEY), null);

  if (structuredAuth) {
    return {
      token: structuredAuth.token || '',
      user: structuredAuth.user || null,
    };
  }

  return {
    token: storage.getItem(LEGACY_TOKEN_STORAGE_KEY) || '',
    user: parseJson(storage.getItem(LEGACY_USER_STORAGE_KEY), null),
  };
}

export function saveStoredAuth(authState) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const normalizedAuthState = {
    token: authState?.token || '',
    user: authState?.user || null,
  };

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedAuthState));

  if (normalizedAuthState.token) {
    storage.setItem(LEGACY_TOKEN_STORAGE_KEY, normalizedAuthState.token);
  } else {
    storage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  }

  if (normalizedAuthState.user) {
    storage.setItem(LEGACY_USER_STORAGE_KEY, JSON.stringify(normalizedAuthState.user));
  } else {
    storage.removeItem(LEGACY_USER_STORAGE_KEY);
  }
}

export function clearStoredAuth() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_STORAGE_KEY);
  storage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  storage.removeItem(LEGACY_USER_STORAGE_KEY);
}

export function loadPasswordResetState() {
  const storage = getStorage();

  if (!storage) {
    return { email: '', otp: '' };
  }

  return parseJson(storage.getItem(PASSWORD_RESET_STORAGE_KEY), { email: '', otp: '' });
}

export function savePasswordResetState(resetState) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(PASSWORD_RESET_STORAGE_KEY, JSON.stringify(resetState));
}

export function clearPasswordResetState() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(PASSWORD_RESET_STORAGE_KEY);
}
