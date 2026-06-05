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
} from '../lib/onboardingStorage';

export interface UseOnboardingReturn {
  slides: OnboardingSlide[];
  currentIndex: number;
  isOpen: boolean;
  hasSeen: boolean;
  loading: boolean;
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
  const [config, setConfigState] = useState<OnboardingConfig>(DEFAULT_CONFIG);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // بارگذاری تنظیمات و وضعیت
  useEffect(() => {
    const loadConfig = () => {
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
      
      // اگر ندیده باشد، اسلایدر را نشان بده
      if (!seen) {
        setIsOpen(true);
      }
      
      setLoading(false);
    };
    
    loadConfig();
  }, [customConfig]);

  // Auto-play
  useEffect(() => {
    if (config.autoPlay && isOpen && !loading) {
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
  }, [config.autoPlay, isOpen, loading, currentIndex, slides.length]);

  const show = useCallback(() => {
    setIsOpen(true);
  }, []);

  const hide = useCallback(() => {
    setIsOpen(false);
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
    setIsOpen(false);
    setHasSeen(true);
    
    // اجرای اکشن اسلاید آخر اگر وجود داشته باشد
    const lastSlide = slides[slides.length - 1];
    if (lastSlide?.action) {
      const { type, target } = lastSlide.action;
      if (type === 'navigate' && typeof window !== 'undefined') {
        window.location.href = target;
      }
    }
  }, [config.completedKey, slides]);

  const reset = useCallback(() => {
    resetOnboarding(config.completedKey);
    setHasSeen(false);
    setCurrentIndex(0);
    setIsOpen(true);
  }, [config.completedKey]);

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