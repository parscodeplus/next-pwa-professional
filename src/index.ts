// src/index.ts
'use client';

// کامپوننت‌ها
export { PWAProvider } from './components/PWAProvider';
export { NetworkStatus } from './components/NetworkStatus';
export { OfflinePage } from './components/OfflinePage';
export { InstallPrompt } from './components/InstallPrompt';
export { ToastProvider, useToast, ToastLegacy as Toast } from './components/Toast';
export { LocationProvider, useLocationContext } from './components/LocationProvider';
export { OnboardingSlider, createOnboardingSlides, presetOnboardingConfig } from './components/OnboardingSlider';

// Hooks
export { useNetworkStatus } from './hooks/useNetworkStatus';
export { useOfflineStorage } from './hooks/useOfflineStorage';
export { usePWAInstall } from './hooks/usePWAInstall';
export { useLocation } from './hooks/useLocation';
export { useNotification } from './hooks/useNotification';
export { useErrorTracking } from './hooks/useErrorTracking';
export { useOnboarding } from './hooks/useOnboarding';

// Types
export type { NetworkStatusType } from './hooks/useNetworkStatus';
export type { UseOfflineStorageOptions, PendingAction } from './hooks/useOfflineStorage';
export type { ToastType } from './components/Toast';
export type { LocationData, AddressData, LocationErrorInfo, UseLocationOptions, UseLocationReturn } from './hooks/useLocation';
export type { UseNotificationReturn, NotificationOptions, NotificationAction } from './hooks/useNotification';
export type { UseErrorTrackingReturn, ErrorContext, ErrorSeverity } from './hooks/useErrorTracking';
export type { UseOnboardingReturn } from './hooks/useOnboarding';
export type { OnboardingSlide, OnboardingConfig } from './lib/onboardingStorage';

// Lib - Notification
export { 
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  saveNotificationSettings,
  getNotificationSettings,
  NotificationTemplates,
} from './lib/notificationUtils';

// Lib - Error Tracking
export {
  initErrorTracking,
  captureError,
  captureMessage,
  capturePromiseError,
  captureNetworkError,
  captureLocationError,
  capturePWAServiceWorkerError,
  addBreadcrumb,
  startTransaction,
  finishTransaction,
} from './lib/errorTracking';

// Lib - Onboarding
export {
  hasSeenOnboarding,
  setOnboardingCompleted,
  saveOnboardingConfig,
  getOnboardingConfig,
  resetOnboarding,
  DEFAULT_SLIDES,
  DEFAULT_CONFIG,
} from './lib/onboardingStorage';

// Lib - بقیه
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