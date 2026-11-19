import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, durationOrOptions = 4000) => {
    const isObj = durationOrOptions && typeof durationOrOptions === 'object';
    const duration = isObj ? (durationOrOptions.duration ?? 5000) : durationOrOptions;
    const actionLabel = isObj ? durationOrOptions.actionLabel : null;
    const onAction = isObj ? durationOrOptions.onAction : null;

    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast = { id, type, message, duration, actionLabel, onAction };

    // Keep maximum 4 concurrent toasts to prevent UI layout overcrowding
    setToasts((prev) => [...prev.slice(-3), newToast]);

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, durOrOpts) => addToast('success', msg, durOrOpts),
    error: (msg, durOrOpts) => addToast('error', msg, durOrOpts),
    info: (msg, durOrOpts) => addToast('info', msg, durOrOpts),
    warning: (msg, durOrOpts) => addToast('warning', msg, durOrOpts),
    undo: (msg, onUndo, duration = 6000) =>
      addToast('info', msg, { duration, actionLabel: 'Undo', onAction: onUndo }),
    remove: removeToast
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      toasts: [],
      toast: {
        success: (msg) => console.log('Toast success:', msg),
        error: (msg) => console.error('Toast error:', msg),
        info: (msg) => console.log('Toast info:', msg),
        warning: (msg) => console.warn('Toast warning:', msg),
        undo: (msg) => console.log('Toast undo:', msg),
        remove: () => {}
      },
      removeToast: () => {}
    };
  }
  return ctx;
};
