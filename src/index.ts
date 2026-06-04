// src/index.ts
'use client';

export { PWAProvider } from './components/PWAProvider';
export { NetworkStatus } from './components/NetworkStatus';
export { OfflinePage } from './components/OfflinePage';
export { InstallPrompt } from './components/InstallPrompt';
export { ToastProvider, useToast, ToastLegacy as Toast } from './components/Toast';

export { useNetworkStatus } from './hooks/useNetworkStatus';
export { useOfflineStorage } from './hooks/useOfflineStorage';
export { usePWAInstall } from './hooks/usePWAInstall';

export type { NetworkStatusType } from './hooks/useNetworkStatus';
export type { UseOfflineStorageOptions, PendingAction } from './hooks/useOfflineStorage';
export type { ToastType } from './components/Toast';

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
export { toastEvents, setupNetworkToastListener } from './lib/toastEvents';