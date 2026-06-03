// src/lib/swRegistration.ts
'use client';

export interface SWRegistrationOptions {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

let swRegistration: ServiceWorkerRegistration | null = null;

// تعریف type برای ServiceWorkerRegistration با پشتیبانی از sync
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: {
    register: (tag: string) => Promise<void>;
  };
}

export async function registerSW(
  swPath: string = '/sw.js',
  options: SWRegistrationOptions = {}
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker is not supported in this browser');
    return null;
  }

  try {
    // ثبت Service Worker
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: '/',
    });
    
    swRegistration = registration;
    console.log('✅ Service Worker registered successfully:', registration);
    options.onSuccess?.(registration);

    // مدیریت به‌روزرسانی
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        console.log('🔄 New Service Worker found, updating...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('📦 New Service Worker is ready, refresh to update');
            options.onUpdate?.(registration);
            
            // نمایش نوتیفیکیشن به کاربر
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('بروزرسانی برنامه', {
                body: 'نسخه جدید برنامه آماده است. برای اعمال تغییرات صفحه را refresh کنید.',
                icon: '/icons/icon-192x192.png',
              });
            }
          }
        });
      }
    });

    // همگام‌سازی پس از اتصال مجدد - با بررسی وجود sync
    window.addEventListener('online', () => {
      console.log('🌐 Online, syncing with server...');
      const regWithSync = registration as ServiceWorkerRegistrationWithSync;
      if (regWithSync.sync) {
        regWithSync.sync.register('sync-pending-actions').catch((err) => {
          console.log('Background sync not supported:', err);
        });
      } else {
        console.log('Background sync not supported in this browser');
      }
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    options.onError?.(error as Error);
    return null;
  }
}

export async function unregisterSW(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const unregistered = await registration.unregister();
    
    if (unregistered) {
      console.log('✅ Service Worker unregistered successfully');
      swRegistration = null;
    }
    
    return unregistered;
  } catch (error) {
    console.error('❌ Failed to unregister Service Worker:', error);
    return false;
  }
}

export async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  
  if (swRegistration) return swRegistration;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    swRegistration = registration;
    return registration;
  } catch (error) {
    console.error('❌ Failed to get SW registration:', error);
    return null;
  }
}

export async function sendMessageToSW(message: any): Promise<void> {
  const registration = await getSWRegistration();
  if (registration?.active) {
    registration.active.postMessage(message);
  }
}

export function subscribeToSWMessages(callback: (event: MessageEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: MessageEvent) => {
    callback(event);
  };
  
  navigator.serviceWorker.addEventListener('message', handler);
  
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}