// src/components/PWAProvider.tsx
'use client';

import React, { useEffect } from 'react';
import { NetworkStatus } from './NetworkStatus';
import { InstallPrompt } from './InstallPrompt';
import { ToastProvider, useToast } from './Toast';
import { registerSW } from '../lib/swRegistration';
import { setupNetworkToastListener } from '../lib/toastEvents';

export interface PWAProviderProps {
  children: React.ReactNode;
  swPath?: string;
  enableInstallPrompt?: boolean;
  enableToasts?: boolean;
  showNetworkBanner?: boolean;
  showSpeedWidget?: boolean;
  speedWidgetPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoNetworkToasts?: boolean;
  bannerPosition?: 'top' | 'bottom';
  autoHideDelay?: number;
}

function ToastEventHandler({ 
  enableToasts, 
  autoNetworkToasts,
}: { 
  enableToasts: boolean;
  autoNetworkToasts: boolean;
}) {
  const { showNetworkToast, showToast } = useToast();

  useEffect(() => {
    if (!enableToasts) return;

    let cleanup: (() => void) | undefined;
    
    if (autoNetworkToasts) {
      cleanup = setupNetworkToastListener(showNetworkToast);
    }

    const handleSWEvents = () => {
      if (typeof window !== 'undefined' && navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'CACHE_UPDATED') {
            showToast('نسخه جدید برنامه در پس‌زمینه دانلود شد', 'info', 4000);
          }
        });
      }
    };

    handleSWEvents();

    return () => {
      if (cleanup) cleanup();
    };
  }, [enableToasts, autoNetworkToasts, showNetworkToast, showToast]);

  return null;
}

export function PWAProvider({ 
  children, 
  swPath = '/sw.js',
  enableInstallPrompt = true,
  enableToasts = true,
  showNetworkBanner = false,    // تغییر پیش‌فرض به false
  showSpeedWidget = false,       // تغییر پیش‌فرض به false
  speedWidgetPosition = 'top-right',
  autoNetworkToasts = true,
  bannerPosition = 'top',
  autoHideDelay = 3000,
}: PWAProviderProps) {
  
  useEffect(() => {
    registerSW(swPath);
  }, [swPath]);

  return (
    <ToastProvider>
      {enableToasts && (
        <ToastEventHandler 
          enableToasts={enableToasts}
          autoNetworkToasts={autoNetworkToasts}
        />
      )}
      {children}
      
      {/* فقط در صورت درخواست صریح، NetworkStatus رندر شود */}
      {(showNetworkBanner || showSpeedWidget) && (
        <NetworkStatus 
          showBanner={showNetworkBanner}
          showWidget={showSpeedWidget}
          widgetPosition={speedWidgetPosition}
          position={bannerPosition}
          autoHideDelay={autoHideDelay}
          showDetails={showSpeedWidget}
        />
      )}
      
      {enableInstallPrompt && <InstallPrompt />}
    </ToastProvider>
  );
}