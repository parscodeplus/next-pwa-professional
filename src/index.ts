// src/index.ts
'use client';

// کامپوننت‌ها
export { PWAProvider } from './components/PWAProvider';
export { NetworkStatus } from './components/NetworkStatus';
export { OfflinePage } from './components/OfflinePage';
export { InstallPrompt } from './components/InstallPrompt';

// Hooks
export { useNetworkStatus } from './hooks/useNetworkStatus';
export { useOfflineStorage } from './hooks/useOfflineStorage';
export { usePWAInstall } from './hooks/usePWAInstall';

// Types - Re-export از فایل‌های مربوطه
export type { NetworkStatusType } from './hooks/useNetworkStatus';
export type { UseOfflineStorageOptions } from './hooks/useOfflineStorage';
export type { PendingAction } from './lib/offlineStorage';

// Lib
export { 
  registerSW, 
  unregisterSW, 
  sendMessageToSW, 
  subscribeToSWMessages 
} from './lib/swRegistration';
export { cacheManager } from './lib/cacheManager';
export { 
  savePendingAction, 
  getPendingActions, 
  removePendingAction,
  cacheData,
  getCachedData,
  clearAllPendingActions,
  updateRetryCount
} from './lib/offlineStorage';