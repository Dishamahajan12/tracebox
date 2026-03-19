import { createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { clearStoredAuth, loadStoredAuth, saveStoredAuth } from '../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const storedAuth = loadStoredAuth();
  const [token, setToken] = useState(storedAuth.token || '');
  const [currentUser, setCurrentUser] = useState(storedAuth.user || null);
  const [authLoading, setAuthLoading] = useState(Boolean(storedAuth.token));

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function hydrateUser() {
      try {
        const fullUser = await userService.getCurrentUser({
          skipAuthHandling: true,
        });

        if (!isMounted) {
          return;
        }

        setCurrentUser(fullUser);
        saveStoredAuth({ token, user: fullUser });
      } catch {
        if (!isMounted) {
          return;
        }

        clearStoredAuth();
        setToken('');
        setCurrentUser(null);
        navigate('/login', { replace: true });
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredAuth();
      setToken('');
      setCurrentUser(null);
      showError('Session expired', 'Please sign in again to continue.');
      navigate('/login', { replace: true });
    }

    window.addEventListener('tracebox:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('tracebox:unauthorized', handleUnauthorized);
  }, [navigate, showError]);

  async function fetchCurrentUser() {
    const nextToken = loadStoredAuth().token;
    const fullUser = await userService.getCurrentUser({
      skipAuthHandling: true,
    });

    setCurrentUser(fullUser);
    saveStoredAuth({ token: nextToken, user: fullUser });
    return fullUser;
  }

  function persistAuth(authPayload) {
    const nextToken = authPayload?.token || '';
    const nextUser = authPayload?.user || null;

    if (!nextToken) {
      throw new Error('Authentication token missing from server response.');
    }

    setToken(nextToken);
    setCurrentUser(nextUser);
    saveStoredAuth({ token: nextToken, user: nextUser });
  }

  async function login(payload) {
    const authPayload = await authService.login(payload);
    persistAuth(authPayload);
    await fetchCurrentUser();
    showSuccess('Welcome back', 'You are now signed in to TraceBox.');
    navigate('/dashboard', { replace: true });
    return true;
  }

  async function signup(payload) {
    const authPayload = await authService.signup(payload);
    persistAuth(authPayload);
    await fetchCurrentUser();
    showSuccess('Account created', 'Your workspace is ready.');
    navigate('/dashboard', { replace: true });
    return true;
  }

  function syncCurrentUser(nextUser) {
    setCurrentUser(nextUser);
    saveStoredAuth({ token, user: nextUser });
  }

  function logout({ shouldNotify = true } = {}) {
    clearStoredAuth();
    setToken('');
    setCurrentUser(null);

    if (shouldNotify) {
      showSuccess('Signed out', 'You have been logged out safely.');
    }

    navigate('/login', { replace: true });
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        currentUser,
        authLoading,
        isAuthenticated: Boolean(token),
        login,
        signup,
        logout,
        fetchCurrentUser,
        syncCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
