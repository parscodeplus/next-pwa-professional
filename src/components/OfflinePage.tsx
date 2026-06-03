// src/components/OfflinePage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useOfflineStorage } from '../hooks/useOfflineStorage';

interface OfflinePageProps {
  onRetry?: () => void;
  customMessage?: string;
  showPendingActions?: boolean;
}

export function OfflinePage({ 
  onRetry, 
  customMessage,
  showPendingActions = true,
}: OfflinePageProps) {
  const { pendingActions, isOnline, syncWithServer, pendingCount } = useOfflineStorage({
    autoSync: false,
  });
  
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      setIsSyncing(true);
      await syncWithServer();
      setIsSyncing(false);
      window.location.reload();
    }
  };

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleRetry();
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* آیکون آفلاین */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"strokeWidth={1.5} d="M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01" />
            </svg>
          </div>
        </div>

        {/* عنوان */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {customMessage || 'عدم دسترسی به اینترنت'}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          به نظر می‌رسد اتصال اینترنت شما قطع است. لطفاً اتصال خود را بررسی کنید و دوباره تلاش نمایید.
        </p>

        {/* نمایش اقدامات معلق */}
        {showPendingActions && pendingCount > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{pendingCount} عملیات در صف همگام‌سازی</span>
            </div>
          </div>
        )}

        {/* دکمه تلاش مجدد */}
        <button
          onClick={handleRetry}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>در حال همگام‌سازی...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>تلاش مجدد</span>
            </>
          )}
        </button>

        {/* اطلاعات اضافی */}
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          پس از برقراری اتصال، تمام تغییرات شما به‌طور خودکار همگام‌سازی خواهد شد.
        </p>
      </div>
    </div>
  );
}