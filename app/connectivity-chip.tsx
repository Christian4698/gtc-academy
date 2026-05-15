'use client';

import { useEffect, useState } from 'react';

export function ConnectivityChip() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <span className={isOnline ? 'status-chip status-chip-online' : 'status-chip status-chip-offline'}>
      <span aria-hidden="true" />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}
