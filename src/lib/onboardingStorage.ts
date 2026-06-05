// src/lib/onboardingStorage.ts
'use client';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image?: string;
  icon?: string;
  backgroundColor?: string;
  primaryColor?: string;
  buttonText?: string;
  action?: {
    type: 'link' | 'function' | 'navigate';
    target: string;
  };
}

export interface OnboardingConfig {
  slides: OnboardingSlide[];
  showSkip: boolean;
  showDots: boolean;
  autoPlay: boolean;
  autoPlayDelay: number;
  allowSwipe: boolean;
  allowDrag: boolean;
  loop: boolean;
  finalButtonText: string;
  skipButtonText: string;
  nextButtonText: string;
  backButtonText: string;
  completedKey: string;
}

// کلید پیش‌فرض برای ذخیره وضعیت دیده شدن اسلایدر
const DEFAULT_COMPLETED_KEY = 'onboarding_completed';
const DEFAULT_CONFIG_KEY = 'onboarding_config';

// بررسی آیا کاربر قبلاً اسلایدر را دیده است
export function hasSeenOnboarding(key: string = DEFAULT_COMPLETED_KEY): boolean {
  if (typeof window === 'undefined') return true;
  const value = localStorage.getItem(key);
  return value === 'true';
}

// ثبت اینکه کاربر اسلایدر را دیده است
export function setOnboardingCompleted(completed: boolean = true, key: string = DEFAULT_COMPLETED_KEY): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(completed));
  }
}

// ذخیره تنظیمات اسلایدر در localStorage
export function saveOnboardingConfig(config: OnboardingConfig, key: string = DEFAULT_CONFIG_KEY): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(config));
  }
}

// دریافت تنظیمات اسلایدر از localStorage
export function getOnboardingConfig(key: string = DEFAULT_CONFIG_KEY): OnboardingConfig | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
  }
  return null;
}

// پاک کردن وضعیت اسلایدر (برای تست)
export function resetOnboarding(key: string = DEFAULT_COMPLETED_KEY): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
}

// اسلایدهای پیش‌فرض (در صورت عدم ارائه تنظیمات)
export const DEFAULT_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: '✨ به برنامه خوش آمدید',
    description: 'برنامه شما آماده استفاده است. از قابلیت‌های آفلاین و PWA لذت ببرید.',
    image: '/images/onboarding/welcome.svg',
    backgroundColor: '#6366f1',
    buttonText: 'شروع',
  },
  {
    id: 'offline',
    title: '📡 کار در حالت آفلاین',
    description: 'حتی بدون اینترنت هم می‌توانید از برنامه استفاده کنید. داده‌ها پس از آنلاین شدن همگام‌سازی می‌شوند.',
    image: '/images/onboarding/offline.svg',
    backgroundColor: '#10b981',
  },
  {
    id: 'pwa',
    title: '📱 نصب روی دستگاه',
    description: 'می‌توانید برنامه را روی صفحه اصلی گوشی خود نصب کنید و مانند یک اپلیکیشن بومی از آن استفاده کنید.',
    image: '/images/onboarding/pwa.svg',
    backgroundColor: '#f59e0b',
  },
  {
    id: 'location',
    title: '📍 موقعیت مکانی',
    description: 'با فعال کردن موقعیت مکانی، امکانات بیشتری در اختیار شما قرار می‌گیرد.',
    image: '/images/onboarding/location.svg',
    backgroundColor: '#ef4444',
  },
];

// تنظیمات پیش‌فرض
export const DEFAULT_CONFIG: OnboardingConfig = {
  slides: DEFAULT_SLIDES,
  showSkip: true,
  showDots: true,
  autoPlay: false,
  autoPlayDelay: 5000,
  allowSwipe: true,
  allowDrag: true,
  loop: false,
  finalButtonText: 'شروع استفاده از برنامه',
  skipButtonText: 'رد کردن',
  nextButtonText: 'بعدی',
  backButtonText: 'قبلی',
  completedKey: DEFAULT_COMPLETED_KEY,
};