// src/lib/toastEvents.ts
'use client';

type ToastEventType = 'network-status' | 'pwa-install' | 'sync-start' | 'sync-complete' | 'sync-error' | 'cache-updated';

interface ToastEvent {
  type: ToastEventType;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  data?: any;
}

type ToastListener = (event: ToastEvent) => void;

class ToastEventEmitter {
  private listeners: Map<ToastEventType, ToastListener[]> = new Map();

  on(type: ToastEventType, listener: ToastListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  off(type: ToastEventType, listener: ToastListener) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) listeners.splice(index, 1);
    }
  }

  emit(type: ToastEventType, message: string, severity: ToastEvent['severity'], data?: any) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener({ type, message, severity, data }));
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const toastEvents = new ToastEventEmitter();

// تابع کمکی برای نمایش خودکار پیام‌های شبکه
export function setupNetworkToastListener(
  showNetworkToast: (status: 'online' | 'offline' | 'slow' | 'back-online', speed?: number) => void
) {
  if (typeof window === 'undefined') return () => {};

  let wasOffline = false;
  let lastSpeed = 0;
  let hasShownOfflineToast = false;

  const handleOnline = () => {
    console.log('🌐 Network Toast: Online event triggered');
    
    if (wasOffline) {
      // اگر قبلاً آفلاین بودیم، نشان بده که دوباره آنلاین شدیم
      showNetworkToast('back-online');
      wasOffline = false;
      hasShownOfflineToast = false;
    } else {
      // اگر آنلاین بودیم و قطع نشده بودیم
      showNetworkToast('online');
    }
  };

  const handleOffline = () => {
    console.log('🔌 Network Toast: Offline event triggered');
    
    if (!hasShownOfflineToast) {
      wasOffline = true;
      hasShownOfflineToast = true;
      showNetworkToast('offline');
    }
  };

  const handleSlowConnection = (speed: number) => {
    if (speed < 2 && speed > 0 && speed !== lastSpeed) {
      console.log(`🐌 Network Toast: Slow connection detected (${speed} Mbps)`);
      lastSpeed = speed;
      showNetworkToast('slow', speed);
    }
  };

  // تنظیم listener برای کیفیت شبکه
  const checkNetworkQuality = () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection;
    if (connection) {
      const speed = connection.downlink;
      if (speed !== lastSpeed) {
        lastSpeed = speed;
        if (speed < 2) {
          handleSlowConnection(speed);
        }
      }
    }
  };

  // اضافه کردن event listenerها
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  const connection = (navigator as any).connection;
  if (connection) {
    connection.addEventListener('change', checkNetworkQuality);
  }
  
  // بررسی اولیه وضعیت شبکه
  setTimeout(() => {
    if (!navigator.onLine) {
      console.log('🔌 Network Toast: Initial offline state detected');
      handleOffline();
    } else if ((navigator as any).connection?.downlink < 2) {
      handleSlowConnection((navigator as any).connection.downlink);
    }
  }, 1000);

  // برگرداندن تابع cleanup
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (connection) {
      connection.removeEventListener('change', checkNetworkQuality);
    }
  };
}