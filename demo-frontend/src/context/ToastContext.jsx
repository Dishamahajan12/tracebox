import { createContext, useState } from 'react';
import ToastViewport from '../components/ui/ToastViewport';

export const ToastContext = createContext(null);

let toastSequence = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function dismissToast(toastId) {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }

  function showToast({ title, message, variant = 'info', duration = 3500 }) {
    const nextToast = {
      id: toastSequence += 1,
      title,
      message,
      variant,
    };

    setToasts((currentToasts) => [nextToast, ...currentToasts].slice(0, 4));

    window.setTimeout(() => {
      dismissToast(nextToast.id);
    }, duration);

    return nextToast.id;
  }

  function showSuccess(title, message) {
    return showToast({ title, message, variant: 'success' });
  }

  function showError(title, message) {
    return showToast({ title, message, variant: 'error', duration: 5000 });
  }

  function showInfo(title, message) {
    return showToast({ title, message, variant: 'info' });
  }

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        dismissToast,
      }}
    >
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}
