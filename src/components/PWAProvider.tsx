// src/components/PWAProvider.tsx
'use client';

import React, { useEffect } from 'react';
import { NetworkStatus } from './NetworkStatus';
import { InstallPrompt } from './InstallPrompt';
import { ToastProvider, useToast } from './Toast';
import { registerSW } from '../lib/swRegistration';
import { setupNetworkToastListener } from '../lib/toastEvents';
import { useNotification } from '../hooks/useNotification';
import { useErrorTracking } from '../hooks/useErrorTracking';
import { NotificationTemplates } from '../lib/notificationUtils';

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
  enableNotifications?: boolean;
  enableErrorTracking?: boolean;
  sentryDsn?: string;
  sentryEnvironment?: string;
}

// کامپوننت مدیریت اعلان‌ها

function NotificationEventHandler({ enableNotifications }: { enableNotifications: boolean }) {
  const { showTemplate, requestPermission, permission } = useNotification();

  useEffect(() => {
    if (!enableNotifications) return;

    const handleAppInstalled = () => {
      setTimeout(() => {
        if (permission === 'default') {
          requestPermission();
        }
        showTemplate('pwaInstalled');
      }, 2000);
    };

    const handleOnline = () => {
      showTemplate('backOnline');
    };

    const handleOffline = () => {
      showTemplate('offline');
    };

    const handleSWUpdate = () => {
      showTemplate('newVersion');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sw-updated', handleSWUpdate);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-updated', handleSWUpdate);
    };
  }, [enableNotifications, permission, requestPermission, showTemplate]);

  return null;
}

// کامپوننت مدیریت Error Tracking
function ErrorTrackingHandler({ 
  enableErrorTracking, 
  sentryDsn, 
  sentryEnvironment 
}: { 
  enableErrorTracking: boolean;
  sentryDsn?: string;
  sentryEnvironment?: string;
}) {
  const { captureError, captureMessage, addBreadcrumb } = useErrorTracking();

  // مقداردهی اولیه Sentry
  useEffect(() => {
    if (!enableErrorTracking || !sentryDsn) return;
    
    // import داینامیک برای جلوگیری از خطای SSR
    import('../lib/errorTracking').then(({ initErrorTracking }) => {
      initErrorTracking(sentryDsn, sentryEnvironment || 'production');
      addBreadcrumb('Sentry initialized', 'system');
    });
  }, [enableErrorTracking, sentryDsn, sentryEnvironment, addBreadcrumb]);

  // گرفتن خطاهای React
  useEffect(() => {
    if (!enableErrorTracking) return;

    const originalError = console.error;
    console.error = (...args: any[]) => {
      captureError(args.join(' '), { tags: { source: 'console.error' } });
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, [enableErrorTracking, captureError]);

  // گرفتن خطاهای unhandled rejection
  useEffect(() => {
    if (!enableErrorTracking) return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureError(
        event.reason?.message || 'Unhandled Promise Rejection',
        {
          extra: { reason: event.reason },
          tags: { type: 'unhandledRejection' },
        }
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [enableErrorTracking, captureError]);

  // گرفتن خطاهای network
  useEffect(() => {
    if (!enableErrorTracking) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          captureError(
            `Network Error: ${response.status} ${response.statusText}`,
            {
              extra: { url: args[0], status: response.status },
              tags: { type: 'network-error' },
            }
          );
        }
        return response;
      } catch (error) {
        captureError(error as Error, {
          extra: { url: args[0] },
          tags: { type: 'network-error' },
        });
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enableErrorTracking, captureError]);

  return null;
}

// کامپوننت مدیریت Toast
function ToastEventHandler({ enableToasts, autoNetworkToasts }: { enableToasts: boolean; autoNetworkToasts: boolean }) {
  const { showToast } = useToast();

  useEffect(() => {
    if (!enableToasts || !autoNetworkToasts) return;

    const handleOnline = () => {
      showToast('✅ اتصال اینترنت برقرار شد', 'success', 3000);
    };

    const handleOffline = () => {
      showToast('🔴 اینترنت قطع است', 'error', 0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableToasts, autoNetworkToasts, showToast]);

  return null;
}

export function PWAProvider({ 
  children, 
  swPath = '/sw.js',
  enableInstallPrompt = true,
  enableToasts = true,
  showNetworkBanner = false,
  showSpeedWidget = false,
  speedWidgetPosition = 'top-right',
  autoNetworkToasts = true,
  bannerPosition = 'top',
  autoHideDelay = 3000,
  enableNotifications = true,
  enableErrorTracking = false,
  sentryDsn,
  sentryEnvironment = 'production',
}: PWAProviderProps) {
  
  useEffect(() => {
    registerSW(swPath);
  }, [swPath]);

  const shouldRenderNetworkStatus = showNetworkBanner || showSpeedWidget;

  return (
    <ToastProvider>
      {enableToasts && (
        <ToastEventHandler 
          enableToasts={enableToasts}
          autoNetworkToasts={autoNetworkToasts}
        />
      )}
      
      {enableNotifications && (
        <NotificationEventHandler enableNotifications={enableNotifications} />
      )}
      
      {enableErrorTracking && sentryDsn && (
        <ErrorTrackingHandler 
          enableErrorTracking={enableErrorTracking}
          sentryDsn={sentryDsn}
          sentryEnvironment={sentryEnvironment}
        />
      )}
      
      {children}
      
      {shouldRenderNetworkStatus && (
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