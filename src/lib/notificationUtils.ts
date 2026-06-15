// src/lib/notificationUtils.ts
'use client';

// تایپ برای گزینه‌های Service Worker Registration
interface ServiceWorkerNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  sound?: string;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type NotificationPermission = 'default' | 'granted' | 'denied';

// تایپ برای گزینه‌های Notification مرورگر (بدون title)
type BrowserNotificationOptions = {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
};

// ========== توابع امنیتی ==========

// محدودیت‌های امنیتی
const MAX_PERMISSION_REQUESTS = 2;
const MAX_NOTIFICATION_LENGTH = 200;
const NOTIFICATION_RATE_LIMIT_MS = 1000;
let permissionRequestCount = 0;

// Sanitize متن برای جلوگیری از XSS
function sanitizeText(text: string): string {
  if (!text) return '';
  // حذف کاراکترهای خطرناک HTML/JS
  let cleaned = text
    .replace(/[<>]/g, '')
    .replace(/[&]/g, '&amp;')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (c) => {
      // حذف ایموجی‌های مشکوک (اختیاری)
      return c;
    });
  // محدودیت طول
  cleaned = cleaned.substring(0, MAX_NOTIFICATION_LENGTH);
  return cleaned;
}

// اعتبارسنجی URL برای جلوگیری از open redirect
function isValidRedirectUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url, window.location.origin);
    // فقط آدرس‌های نسبی یا همان دامنه
    const isRelative = !url.startsWith('http') && !url.startsWith('//');
    const isSameOrigin = parsed.origin === window.location.origin;
    const isValidProtocol = ['http:', 'https:'].includes(parsed.protocol);
    return (isRelative || isSameOrigin) && isValidProtocol;
  } catch {
    return false;
  }
}

// بررسی محدودیت نرخ درخواست
function checkRateLimit(): boolean {
  const lastShown = localStorage.getItem('last_notification_time');
  const now = Date.now();
  if (lastShown && (now - parseInt(lastShown)) < NOTIFICATION_RATE_LIMIT_MS) {
    console.warn('Notification rate limit exceeded');
    return false;
  }
  localStorage.setItem('last_notification_time', now.toString());
  return true;
}

// ========== توابع اصلی ==========

// بررسی پشتیبانی مرورگر از Notification
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// دریافت وضعیت مجوز اعلان
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission as NotificationPermission;
}

// درخواست مجوز اعلان با محدودیت
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notification not supported');
    return 'denied';
  }
  
  // محدودیت تعداد درخواست
  if (permissionRequestCount >= MAX_PERMISSION_REQUESTS) {
    console.warn('Maximum permission requests reached');
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  permissionRequestCount++;
  const permission = await Notification.requestPermission();
  return permission as NotificationPermission;
}

// نمایش اعلان با استفاده از Service Worker (روش استاندارد و امن)
export async function showNotification(options: NotificationOptions): Promise<Notification | null> {
  // اعتبارسنجی اولیه
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.warn('Cannot show notification: permission not granted');
    return null;
  }
  
  // محدودیت نرخ
  if (!checkRateLimit()) {
    return null;
  }
  
  // Sanitize ورودی‌ها
  const sanitizedTitle = sanitizeText(options.title);
  const sanitizedBody = sanitizeText(options.body);
  
  if (!sanitizedTitle || !sanitizedBody) {
    console.warn('Invalid notification content');
    return null;
  }
  
  try {
    // تلاش با Service Worker اولویت دارد
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      
      // ساخت گزینه‌های سازگار با Service Worker
      const swOptions: ServiceWorkerNotificationOptions = {
        body: sanitizedBody,
        icon: options.icon || '/icons/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      };
      
      // اضافه کردن badge (با اعتبارسنجی)
      if (options.badge && typeof options.badge === 'string') {
        swOptions.badge = options.badge;
      }
      
      // اضافه کردن vibrate (با اعتبارسنجی)
      if (options.vibrate && Array.isArray(options.vibrate)) {
        swOptions.vibrate = options.vibrate.slice(0, 10); // حداکثر 10 لرزش
      }
      
      // اضافه کردن silent
      if (options.silent === true) {
        swOptions.silent = true;
      }
      
      // اعتبارسنجی data قبل از ارسال
      const safeData = { ...options.data };
      if (safeData.url && !isValidRedirectUrl(safeData.url)) {
        delete safeData.url; // حذف URL نامعتبر
      }
      swOptions.data = safeData;
      
      await registration.showNotification(sanitizedTitle, swOptions);
      
      // برای سازگاری با کد قبلی
      return {
        close: () => {},
        onclick: null,
      } as unknown as Notification;
    }
    
    // Fallback به روش قدیمی (فقط در صورتی که Service Worker در دسترس نباشد)
    const browserOptions: BrowserNotificationOptions = {
      body: sanitizedBody,
      icon: options.icon || '/icons/icon-192x192.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
    };
    
    if (options.badge && typeof options.badge === 'string') {
      browserOptions.badge = options.badge;
    }
    if (options.vibrate && Array.isArray(options.vibrate)) {
      browserOptions.vibrate = options.vibrate.slice(0, 10);
    }
    if (options.silent === true) {
      browserOptions.silent = true;
    }
    
    const notification = new Notification(sanitizedTitle, browserOptions);
    
    const notificationData = options.data;
    // اعتبارسنجی URL قبل از هدایت
    const targetUrl = notificationData?.url;
    if (targetUrl && isValidRedirectUrl(targetUrl)) {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        window.location.href = targetUrl;
        notification.close();
      };
    }
    
    return notification;
  } catch (error) {
    // لاگ خطا بدون اطلاعات حساس
    console.error('Error showing notification:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// ذخیره تنظیمات اعلان در localStorage
export function saveNotificationSettings(enabled: boolean): void {
  if (typeof window !== 'undefined' && typeof enabled === 'boolean') {
    localStorage.setItem('notifications_enabled', JSON.stringify(enabled));
  }
}

// دریافت تنظیمات اعلان از localStorage
export function getNotificationSettings(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('notifications_enabled');
    if (saved !== null) {
      try {
        return JSON.parse(saved) === true;
      } catch {
        return true;
      }
    }
  }
  return true;
}

// انواع اعلان‌های از پیش تعریف شده (امن)
export const NotificationTemplates = {
  pwaInstalled: {
    title: '✅ برنامه نصب شد',
    body: 'برنامه با موفقیت نصب شد. می‌توانید از آفلاین استفاده کنید!',
  },
  newVersion: {
    title: '🔄 نسخه جدید',
    body: 'نسخه جدید برنامه در دسترس است. صفحه را رفرش کنید.',
  },
  offline: {
    title: '📡 قطعی اینترنت',
    body: 'اتصال اینترنت قطع شد. برخی قابلیت‌ها محدود هستند.',
  },
  backOnline: {
    title: '🌐 بازگشت اینترنت',
    body: 'اتصال اینترنت برقرار شد. داده‌ها همگام‌سازی می‌شوند.',
  },
  syncComplete: {
    title: '✅ همگام‌سازی کامل',
    body: 'تمام داده‌ها با سرور همگام‌سازی شدند.',
  },
  locationShared: {
    title: '📍 موقعیت به اشتراک گذاشته شد',
    body: 'موقعیت مکانی شما با موفقیت به اشتراک گذاشته شد.',
  },
} as const;