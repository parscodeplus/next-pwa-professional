// src/lib/errorTracking.ts
'use client';

import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  componentStack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

// مقداردهی اولیه Sentry
export function initErrorTracking(
  dsn: string,
  environment: string = 'production',
  tracesSampleRate: number = 0.2
): void {
  if (typeof window === 'undefined') return;
  
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate,
    debug: environment !== 'production',
    // BrowserTracing و Replay در نسخه جدید به این شکل اضافه می‌شوند
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Replay configuration
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// ثبت خطا
export function captureError(
  error: Error | string,
  context?: ErrorContext,
  severity: ErrorSeverity = 'error'
): void {
  if (typeof window === 'undefined') return;
  
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  Sentry.withScope((scope) => {
    // تنظیم سطح خطا
    if (severity === 'fatal') scope.setLevel('fatal');
    else if (severity === 'error') scope.setLevel('error');
    else if (severity === 'warning') scope.setLevel('warning');
    else if (severity === 'info') scope.setLevel('info');
    else if (severity === 'debug') scope.setLevel('debug');
    
    // اضافه کردن تگ‌ها
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    // اضافه کردن اطلاعات اضافی
    if (context?.extra) {
      scope.setExtras(context.extra);
    }
    
    // اضافه کردن component stack
    if (context?.componentStack) {
      scope.setExtra('componentStack', context.componentStack);
    }
    
    // اضافه کردن شناسه کاربر
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    Sentry.captureException(errorObj);
  });
}

// ثبت پیام
export function captureMessage(
  message: string,
  severity: ErrorSeverity = 'info',
  context?: ErrorContext
): void {
  if (typeof window === 'undefined') return;
  
  Sentry.withScope((scope) => {
    // تنظیم سطح خطا
    if (severity === 'fatal') scope.setLevel('fatal');
    else if (severity === 'error') scope.setLevel('error');
    else if (severity === 'warning') scope.setLevel('warning');
    else if (severity === 'info') scope.setLevel('info');
    else if (severity === 'debug') scope.setLevel('debug');
    
    // اضافه کردن تگ‌ها
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    // اضافه کردن اطلاعات اضافی
    if (context?.extra) {
      scope.setExtras(context.extra);
    }
    
    Sentry.captureMessage(message);
  });
}

// ثبت خطاهای Promise
export function capturePromiseError(promise: Promise<any>, context?: ErrorContext): void {
  promise.catch((error) => {
    captureError(error, context);
  });
}

// ثبت خطاهای Network
export function captureNetworkError(url: string, status: number, statusText: string, context?: ErrorContext): void {
  captureError(
    `Network Error: ${status} ${statusText} for ${url}`,
    {
      ...context,
      extra: {
        ...context?.extra,
        url,
        status,
        statusText,
      },
    }
  );
}

// ثبت خطاهای Location
export function captureLocationError(error: GeolocationPositionError, context?: ErrorContext): void {
  captureError(
    `Location Error: ${error.message}`,
    {
      ...context,
      tags: { ...context?.tags, locationCode: error.code.toString() },
      extra: { ...context?.extra, locationCode: error.code },
    }
  );
}

// ثبت خطاهای PWA
export function capturePWAServiceWorkerError(error: Error, context?: ErrorContext): void {
  captureError(error, {
    ...context,
    tags: { ...context?.tags, serviceWorker: 'failed' },
  });
}

// ایجاد Breadcrumb (ردیابی مسیر کاربر)
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>,
  level: ErrorSeverity = 'info'
): void {
  if (typeof window === 'undefined') return;
  
  let sentryLevel: Sentry.SeverityLevel = 'info';
  if (level === 'fatal') sentryLevel = 'fatal';
  else if (level === 'error') sentryLevel = 'error';
  else if (level === 'warning') sentryLevel = 'warning';
  else if (level === 'debug') sentryLevel = 'debug';
  else sentryLevel = 'info';
  
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: sentryLevel,
  });
}

// شروع تراکنش (برای اندازه‌گیری عملکرد)
export function startTransaction(name: string, op: string): any {
  if (typeof window === 'undefined') return null;
  
  // در نسخه جدید Sentry، از startSpan استفاده می‌شود
  return Sentry.startSpan({
    name,
    op,
  }, () => {});
}

// پایان تراکنش - در نسخه جدید نیازی به پایان دستی نیست
// این تابع برای سازگاری با نسخه قبلی نگهداری می‌شود
export function finishTransaction(transaction: any): void {
  if (transaction && typeof transaction === 'function') {
    // در نسخه جدید، تراکنش‌ها خودکار بسته می‌شوند
    console.debug('Transaction finished automatically in new Sentry version');
  }
}