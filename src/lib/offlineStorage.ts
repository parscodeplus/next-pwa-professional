// src/lib/offlineStorage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// تعریف و export کردن PendingAction
export interface PendingAction {
  id: number;
  action: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

// اصلاح تعریف Schema - استفاده از کلیدهای مشخص
interface PendingActionSchema extends DBSchema {
  actions: {
    key: number;
    value: PendingAction;
    indexes: {
      'timestamp': string;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

let dbInstance: IDBPDatabase<PendingActionSchema> | null = null;

async function getDB() {
  if (!dbInstance) {
    dbInstance = await openDB<PendingActionSchema>('pwa-offline-db', 1, {
      upgrade(db) {
        // ایجاد store برای actions
        if (!db.objectStoreNames.contains('actions')) {
          const actionStore = db.createObjectStore('actions', { keyPath: 'id' });
          // ایجاد ایندکس روی timestamp - با مشخص کردن نوع
          actionStore.createIndex('timestamp', 'timestamp');
        }
        
        // ایجاد store برای cache
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      },
    });
  }
  return dbInstance;
}

export async function savePendingAction(actionName: string, data: any): Promise<number> {
  const db = await getDB();
  const id = Date.now();
  const action: PendingAction = {
    id,
    action: actionName,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
  
  await db.add('actions', action);
  
  // ذخیره در localStorage به عنوان پشتیبان
  const allActions = await getPendingActions();
  localStorage.setItem('pwa-pending-actions', JSON.stringify(allActions));
  
  return id;
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await getDB();
  const actions = await db.getAll('actions');
  actions.sort((a, b) => a.id - b.id);
  return actions;
}

export async function removePendingAction(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('actions', id);
  
  const remaining = await getPendingActions();
  localStorage.setItem('pwa-pending-actions', JSON.stringify(remaining));
}

export async function updateRetryCount(id: number, newCount: number): Promise<void> {
  const db = await getDB();
  const action = await db.get('actions', id);
  if (action) {
    action.retryCount = newCount;
    await db.put('actions', action);
  }
}

export async function clearAllPendingActions(): Promise<void> {
  const db = await getDB();
  const actions = await db.getAll('actions');
  for (const action of actions) {
    await db.delete('actions', action.id);
  }
  localStorage.removeItem('pwa-pending-actions');
}

export async function cacheData(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('cache', { key, value });
}

export async function getCachedData(key: string): Promise<any> {
  const db = await getDB();
  const result = await db.get('cache', key);
  return result?.value;
}