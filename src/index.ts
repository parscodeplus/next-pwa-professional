// src/index.ts
'use client';

// کامپوننت‌ها
export { PWAProvider } from './components/PWAProvider';
export { NetworkStatus } from './components/NetworkStatus';
export { OfflinePage } from './components/OfflinePage';
export { InstallPrompt } from './components/InstallPrompt';
export { ToastProvider, useToast, ToastLegacy as Toast } from './components/Toast';
export { LocationProvider, useLocationContext } from './components/LocationProvider';

// Hooks
export { useNetworkStatus } from './hooks/useNetworkStatus';
export { useOfflineStorage } from './hooks/useOfflineStorage';
export { usePWAInstall } from './hooks/usePWAInstall';
export { useLocation } from './hooks/useLocation';

// Types - مستقیم از فایل‌های اصلی
export type { NetworkStatusType } from './hooks/useNetworkStatus';
export type { UseOfflineStorageOptions, PendingAction } from './hooks/useOfflineStorage';
export type { ToastType } from './components/Toast';
export type { LocationData, AddressData, LocationErrorInfo, UseLocationOptions, UseLocationReturn } from './hooks/useLocation';

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
export { toastEvents, setupNetworkToastListener } from './lib/toastEvents';
export {
  reverseGeocode,
  calculateDistance,
  isWithinRadius,
  saveLocationToCache,
  getLocationFromCache,
  isLocationCacheValid,
  formatLocationError,
} from './lib/locationUtils';