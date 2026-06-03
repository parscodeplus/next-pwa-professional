// src/client-actions/index.ts
'use client';

import { savePendingAction } from '../lib/offlineStorage';

export interface ActionOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  offlineSupport?: boolean;
  maxRetries?: number;
}

export function createOfflineAction<T = any, P = any>(
  actionName: string,
  serverAction: (payload: P) => Promise<T>
) {
  return async (payload: P, options: ActionOptions = {}): Promise<T | null> => {
    const { onSuccess, onError, offlineSupport = true, maxRetries = 3 } = options;
    
    // بررسی وضعیت آنلاین
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    if (!isOnline && offlineSupport) {
      // ذخیره در حالت آفلاین
      console.log(`📱 Offline: Saving action "${actionName}" for later sync`);
      const id = await savePendingAction(actionName, payload);
      
      // نمایش نوتیفیکیشن به کاربر
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('عملیات ذخیره شد', {
          body: 'اطلاعات شما ذخیره شد و پس از اتصال به اینترنت ارسال می‌شود.',
          icon: '/icons/icon-192x192.png',
        });
      }
      
      onSuccess?.({ offline: true, pendingId: id });
      return null;
    }
    
    // اجرا در حالت آنلاین
    try {
      const result = await serverAction(payload);
      onSuccess?.(result);
      return result;
    } catch (error) {
      console.error(`❌ Action "${actionName}" failed:`, error);
      
      // اگر خطا مربوط به قطعی اینترنت بود و offlineSupport فعال است
      if (error instanceof Error && error.message.includes('network') && offlineSupport) {
        const id = await savePendingAction(actionName, payload);
        onSuccess?.({ offline: true, pendingId: id });
        return null;
      }
      
      onError?.(error as Error);
      throw error;
    }
  };
}

export async function syncOfflineActions(): Promise<{ synced: number; failed: number }> {
  const { getPendingActions, removePendingAction } = await import('../lib/offlineStorage');
  
  const actions = await getPendingActions();
  let synced = 0;
  let failed = 0;
  
  for (const action of actions) {
    try {
      // اینجا باید منطق ارسال به سرور را پیاده کنید
      const response = await fetch(`/api/actions/${action.action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.data),
      });
      
      if (response.ok) {
        await removePendingAction(action.id);
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to sync action ${action.id}:`, error);
      failed++;
    }
  }
  
  return { synced, failed };
}