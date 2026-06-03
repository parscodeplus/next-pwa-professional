// src/hooks/usePWAInstall.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  installPrompt: (() => Promise<void>) | null;
  dismissPrompt: () => void;
  showPrompt: boolean;
}

// تعریف type برای window با پشتیبانی از gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissedTimestamp, setDismissedTimestamp] = useState<number | null>(null);

  // بررسی نصب بودن PWA
  const checkIfInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                               (window.navigator as any).standalone === true;
    
    setIsInstalled(isInStandaloneMode);
    return isInStandaloneMode;
  }, []);

  // ذخیره زمان رد کردن در localStorage
  const saveDismissal = useCallback(() => {
    const dismissalTime = Date.now();
    localStorage.setItem('pwa-install-dismissed', dismissalTime.toString());
    setDismissedTimestamp(dismissalTime);
    setShowPrompt(false);
  }, []);

  // بررسی آیا باید prompt نمایش داده شود
  const shouldShowPrompt = useCallback(() => {
    // اگر نصب شده باشد، نمایش نده
    if (checkIfInstalled()) return false;
    
    // اگر قابلیت نصب وجود نداشته باشد
    if (!isInstallable) return false;
    
    // بررسی زمان آخرین رد کردن (۷ روز)
    const lastDismissal = localStorage.getItem('pwa-install-dismissed');
    if (lastDismissal) {
      const dismissalTime = parseInt(lastDismissal, 10);
      const daysSinceDismissal = (Date.now() - dismissalTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) return false;
    }
    
    // بررسی چند بار رد کردن
    const dismissCount = parseInt(localStorage.getItem('pwa-install-dismiss-count') || '0', 10);
    if (dismissCount >= 3) return false;
    
    return true;
  }, [isInstallable, checkIfInstalled]);

  // نمایش prompt نصب
  const installPrompt = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
        setShowPrompt(false);
        setDeferredPrompt(null);
        localStorage.removeItem('pwa-install-dismissed');
        localStorage.removeItem('pwa-install-dismiss-count');
        
        // ارسال رویداد آنالیتیک - با بررسی وجود gtag
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'pwa_installed');
        }
      } else {
        console.log('User dismissed the install prompt');
        const count = parseInt(localStorage.getItem('pwa-install-dismiss-count') || '0', 10);
        localStorage.setItem('pwa-install-dismiss-count', (count + 1).toString());
        saveDismissal();
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  }, [deferredPrompt, saveDismissal]);

  // رد کردن بدون نمایش دکمه نصب
  const dismissPrompt = useCallback(() => {
    saveDismissal();
    setDeferredPrompt(null);
  }, [saveDismissal]);

  //监听 beforeinstallprompt 事件
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      if (shouldShowPrompt()) {
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-dismiss-count');
      
      // ارسال رویداد آنالیتیک - با بررسی وجود gtag
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'pwa_installed');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // بررسی وضعیت نصب در شروع
    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkIfInstalled, shouldShowPrompt]);

  return {
    isInstallable,
    isInstalled,
    installPrompt: showPrompt ? installPrompt : null,
    dismissPrompt,
    showPrompt,
  };
}