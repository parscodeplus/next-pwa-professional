// src/hooks/useOfflineStorage.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  savePendingAction, 
  getPendingActions, 
  removePendingAction,
  cacheData,
  getCachedData,
  clearAllPendingActions,
  updateRetryCount,
  type PendingAction
} from '../lib/offlineStorage';

export interface UseOfflineStorageOptions {
  autoSync?: boolean;
  maxRetries?: number;
  onSyncSuccess?: (id: number) => void;
  onSyncError?: (id: number, error: Error) => void;
}

export function useOfflineStorage(options: UseOfflineStorageOptions = {}) {
  const {
    autoSync = true,
    maxRetries = 3,
    onSyncSuccess,
    onSyncError,
  } = options;

  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const loadPendingActions = useCallback(async () => {
    const actions = await getPendingActions();
    setPendingActions(actions);
    return actions;
  }, []);

  const storeAction = useCallback(async (actionName: string, data: any): Promise<number> => {
    const id = await savePendingAction(actionName, data);
    await loadPendingActions();
    return id;
  }, [loadPendingActions]);

  const deleteAction = useCallback(async (id: number) => {
    await removePendingAction(id);
    await loadPendingActions();
  }, [loadPendingActions]);

  const syncWithServer = useCallback(async (customSyncFn?: (action: PendingAction) => Promise<any>) => {
    if (!isOnline) {
      console.log('🚫 Offline: Cannot sync');
      return false;
    }

    if (isSyncing) {
      console.log('⏳ Already syncing');
      return false;
    }

    setIsSyncing(true);
    const actions = await getPendingActions();
    
    let successCount = 0;
    
    for (const action of actions) {
      if (action.retryCount >= maxRetries) {
        console.warn(`⚠️ Action ${action.id} exceeded max retries`);
        await deleteAction(action.id);
        continue;
      }
      
      try {
        if (customSyncFn) {
          await customSyncFn(action);
        } else {
          const response = await fetch(`/api/offline-sync/${action.action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data),
          });
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
        }
        
        await deleteAction(action.id);
        successCount++;
        onSyncSuccess?.(action.id);
      } catch (error) {
        console.error(`❌ Sync failed for action ${action.id}:`, error);
        await updateRetryCount(action.id, action.retryCount + 1);
        onSyncError?.(action.id, error as Error);
      }
    }
    
    setIsSyncing(false);
    await loadPendingActions();
    
    if (successCount > 0) {
      console.log(`✅ Synced ${successCount} actions successfully`);
    }
    
    return successCount > 0;
  }, [isOnline, isSyncing, maxRetries, deleteAction, loadPendingActions, onSyncSuccess, onSyncError]);

  const setCache = useCallback(async (key: string, value: any) => {
    await cacheData(key, value);
  }, []);

  const getCache = useCallback(async (key: string) => {
    return await getCachedData(key);
  }, []);

  const clearAll = useCallback(async () => {
    await clearAllPendingActions();
    await loadPendingActions();
  }, [loadPendingActions]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        syncWithServer();
      }
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, syncWithServer]);

  useEffect(() => {
    loadPendingActions();
  }, [loadPendingActions]);

  return {
    pendingActions,
    isSyncing,
    isOnline,
    pendingCount: pendingActions.length,
    storeAction,
    deleteAction,
    syncWithServer,
    setCache,
    getCache,
    clearAll,
    loadPendingActions,
  };
}

// Re-export type
export type { PendingAction };