// src/components/PWAProvider.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { NetworkStatus } from './NetworkStatus';
import { InstallPrompt } from './InstallPrompt';
import { registerSW } from '../lib/swRegistration';

interface PWAProviderProps {
  children: React.ReactNode;
  swPath?: string;
  enableInstallPrompt?: boolean;
  offlinePagePath?: string;
}

export function PWAProvider({ 
  children, 
  swPath = '/sw.js',
  enableInstallPrompt = true,
  offlinePagePath = '/offline'
}: PWAProviderProps) {
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    // ثبت Service Worker
    registerSW(swPath);
    
    // بررسی وضعیت آفلاین
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setIsOfflineReady(true);
    }

    window.addEventListener('online', () => setIsOfflineReady(false));
    window.addEventListener('offline', () => setIsOfflineReady(true));

    return () => {
      window.removeEventListener('online', () => setIsOfflineReady(false));
      window.removeEventListener('offline', () => setIsOfflineReady(true));
    };
  }, [swPath]);

  return (
    <>
      {children}
      <NetworkStatus />
      {enableInstallPrompt && <InstallPrompt />}
    </>
  );
}