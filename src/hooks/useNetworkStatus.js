import { useState, useEffect } from 'react';

/**
 * Tracks browser online/offline connectivity and recent reconnection state
 * so operational staff are warned before attempting edits while offline.
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    let reconnectTimer = null;

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => setJustReconnected(false), 4500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return { isOnline, justReconnected };
};

export default useNetworkStatus;
