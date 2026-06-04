// src/hooks/useNetworkStatus.ts
'use client';

import { useState, useEffect } from 'react';

// تغییر نام تایپ به NetworkStatusType برای جلوگیری از تداخل
export interface NetworkStatusType {
  isOnline: boolean;
  wasOffline: boolean;
  networkType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  downlinkMax: number | null;
  rtt: number | null;
  saveData: boolean | null;
  since: Date | null;
  lastChecked: Date | null;
}

export function useNetworkStatus(): NetworkStatusType {
  const [status, setStatus] = useState<NetworkStatusType>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    networkType: null,
    effectiveType: null,
    downlink: null,
    downlinkMax: null,
    rtt: null,
    saveData: null,
    since: null,
    lastChecked: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                         (navigator as any).mozConnection || 
                         (navigator as any).webkitConnection;
      
      if (connection) {
        setStatus(prev => ({
          ...prev,
          networkType: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || null,
          downlinkMax: connection.downlinkMax || null,
          rtt: connection.rtt || null,
          saveData: connection.saveData || false,
          lastChecked: new Date(),
        }));
      }
    };

    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        wasOffline: true,
        since: new Date(),
      }));
      setTimeout(() => {
        setStatus(prev => ({ ...prev, wasOffline: false }));
      }, 3000);
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        wasOffline: true,
        since: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }
    
    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return status;
}