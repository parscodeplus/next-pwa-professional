// src/hooks/useErrorTracking.ts
'use client';

import { useEffect, useCallback } from 'react';
import {
  captureError,
  captureMessage,
  addBreadcrumb,
  ErrorContext,
  ErrorSeverity,
} from '../lib/errorTracking';

// Export types برای استفاده در index.ts
export type { ErrorContext, ErrorSeverity };

export interface UseErrorTrackingReturn {
  captureError: (error: Error | string, context?: ErrorContext, severity?: ErrorSeverity) => void;
  captureMessage: (message: string, severity?: ErrorSeverity, context?: ErrorContext) => void;
  addBreadcrumb: (message: string, category: string, data?: Record<string, any>) => void;
}

export function useErrorTracking(): UseErrorTrackingReturn {
  const handleError = useCallback((
    error: Error | string,
    context?: ErrorContext,
    severity: ErrorSeverity = 'error'
  ) => {
    captureError(error, context, severity);
  }, []);

  const handleMessage = useCallback((
    message: string,
    severity: ErrorSeverity = 'info',
    context?: ErrorContext
  ) => {
    captureMessage(message, severity, context);
  }, []);

  const handleBreadcrumb = useCallback((
    message: string,
    category: string,
    data?: Record<string, any>
  ) => {
    addBreadcrumb(message, category, data);
  }, []);

  // گرفتن خطاهای global
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      handleError(args.join(' '), { tags: { source: 'console.error' } });
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      handleMessage(args.join(' '), 'warning', { tags: { source: 'console.warn' } });
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [handleError, handleMessage]);

  // گرفتن خطاهای unhandled rejection
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(
        event.reason?.message || 'Unhandled Promise Rejection',
        {
          extra: { reason: event.reason },
          tags: { type: 'unhandledRejection' },
        }
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [handleError]);

  return {
    captureError: handleError,
    captureMessage: handleMessage,
    addBreadcrumb: handleBreadcrumb,
  };
}