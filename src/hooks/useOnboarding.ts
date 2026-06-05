// src/hooks/useOnboarding.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  OnboardingSlide,
  OnboardingConfig,
  hasSeenOnboarding,
  setOnboardingCompleted,
  saveOnboardingConfig,
  getOnboardingConfig,
  resetOnboarding,
  DEFAULT_CONFIG,
  isInstalledPWA,
  setPWAInstalled,
} from '../lib/onboardingStorage';

export interface UseOnboardingReturn {
  slides: OnboardingSlide[];
  currentIndex: number;
  isOpen: boolean;
  hasSeen: boolean;
  loading: boolean;
  isPWAInstalled: boolean;
  show: () => void;
  hide: () => void;
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  complete: () => void;
  reset: () => void;
  setConfig: (config: Partial<OnboardingConfig>) => void;
  config: OnboardingConfig;
}

export function useOnboarding(customConfig?: Partial<OnboardingConfig>): UseOnboardingReturn {
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasSeen, setHasSeen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPWAInstalled, setIsPWAInstalled] = useState<boolean>(false);
  const [config, setConfigState] = useState<OnboardingConfig>(DEFAULT_CONFIG);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const initializedRef = useRef(false);

  // بارگذاری تنظیمات و وضعیت - فقط یکبار اجرا شود
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const loadConfig = () => {
      // بررسی نصب بودن PWA
      const pwaInstalled = isInstalledPWA();
      setIsPWAInstalled(pwaInstalled);
      
      // بارگذاری تنظیمات از localStorage یا استفاده از پیش‌فرض
      const savedConfig = getOnboardingConfig();
      let finalConfig = savedConfig ? { ...savedConfig, ...customConfig } : { ...DEFAULT_CONFIG, ...customConfig };
      
      // اطمینان از وجود slides
      if (!finalConfig.slides || finalConfig.slides.length === 0) {
        finalConfig.slides = DEFAULT_CONFIG.slides;
      }
      
      setConfigState(finalConfig);
      setSlides(finalConfig.slides);
      
      // بررسی دیده شدن
      const seen = hasSeenOnboarding(finalConfig.completedKey);
      setHasSeen(seen);
      
      // تصمیم‌گیری برای نمایش اسلایدر:
      const shouldShow = !seen && (
        !finalConfig.showOnlyInPWA || (finalConfig.showOnlyInPWA && pwaInstalled)
      );
      
      if (shouldShow && isMountedRef.current) {
        setIsOpen(true);
      }
      
      if (isMountedRef.current) {
        setLoading(false);
      }
    };
    
    loadConfig();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [customConfig]); // فقط وابسته به customConfig

  // گوش دادن به رویداد نصب PWA
  useEffect(() => {
    const handleAppInstalled = () => {
      if (!isMountedRef.current) return;
      setPWAInstalled(true);
      setIsPWAInstalled(true);
      
      // اگر اسلایدر قبلاً دیده نشده و تنظیمات ایجاب می‌کند، نمایش بده
      if (!hasSeen && config.showOnlyInPWA && isMountedRef.current) {
        setIsOpen(true);
      }
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [hasSeen, config.showOnlyInPWA]);

  // Auto-play
  useEffect(() => {
    if (config.autoPlay && isOpen && !loading && slides.length > 0) {
      autoPlayTimerRef.current = setInterval(() => {
        if (currentIndex < slides.length - 1) {
          next();
        } else {
          complete();
        }
      }, config.autoPlayDelay);
    }
    
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [config.autoPlay, isOpen, loading, currentIndex, slides.length, config.autoPlayDelay]);

  const show = useCallback(() => {
    if (isMountedRef.current) {
      setIsOpen(true);
    }
  }, []);

  const hide = useCallback(() => {
    if (isMountedRef.current) {
      setIsOpen(false);
    }
  }, []);

  const next = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      complete();
    }
  }, [currentIndex, slides.length]);

  const previous = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  }, [slides.length]);

  const complete = useCallback(() => {
    setOnboardingCompleted(true, config.completedKey);
    if (isMountedRef.current) {
      setIsOpen(false);
      setHasSeen(true);
    }
    
    // اجرای اکشن اسلاید آخر اگر وجود داشته باشد
    const lastSlide = slides[slides.length - 1];
    if (lastSlide?.action && typeof window !== 'undefined') {
      const { type, target } = lastSlide.action;
      if (type === 'navigate') {
        window.location.href = target;
      }
    }
  }, [config.completedKey, slides]);

  const reset = useCallback(() => {
    resetOnboarding(config.completedKey);
    if (isMountedRef.current) {
      setHasSeen(false);
      setCurrentIndex(0);
      
      if (!config.showOnlyInPWA || (config.showOnlyInPWA && isPWAInstalled)) {
        setIsOpen(true);
      }
    }
  }, [config.completedKey, config.showOnlyInPWA, isPWAInstalled]);

  const setConfig = useCallback((newConfig: Partial<OnboardingConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfigState(updatedConfig);
    setSlides(updatedConfig.slides);
    saveOnboardingConfig(updatedConfig);
  }, [config]);

  return {
    slides,
    currentIndex,
    isOpen,
    hasSeen,
    loading,
    isPWAInstalled,
    show,
    hide,
    next,
    previous,
    goTo,
    complete,
    reset,
    setConfig,
    config,
  };
}