// src/lib/cacheManager.ts
'use client';

export interface CacheConfig {
  name: string;
  maxEntries?: number;
  maxAgeSeconds?: number;
}

export interface CachedResponse {
  data: any;
  timestamp: number;
  url: string;
}

class CacheManager {
  private caches: Map<string, Cache> = new Map();
  private configs: Map<string, CacheConfig> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'caches' in window) {
      this.initializeDefaultCaches();
    }
  }

  private async initializeDefaultCaches() {
    // کش پیش‌فرض برای API
    this.addCache('api-cache', {
      name: 'api-cache',
      maxEntries: 100,
      maxAgeSeconds: 300, // 5 minutes
    });

    // کش برای صفحات استاتیک
    this.addCache('static-cache', {
      name: 'static-cache',
      maxEntries: 50,
      maxAgeSeconds: 86400, // 24 hours
    });
  }

  public addCache(name: string, config: CacheConfig) {
    this.configs.set(name, config);
  }

  private async getCache(name: string): Promise<Cache | null> {
    if (typeof window === 'undefined') return null;
    
    if (!this.caches.has(name)) {
      try {
        const cache = await caches.open(name);
        this.caches.set(name, cache);
      } catch (error) {
        console.error(`Failed to open cache ${name}:`, error);
        return null;
      }
    }
    
    return this.caches.get(name) || null;
  }

  public async set(key: string, value: any, cacheName: string = 'api-cache'): Promise<boolean> {
    const cache = await this.getCache(cacheName);
    if (!cache) return false;

    const config = this.configs.get(cacheName);
    const cachedResponse: CachedResponse = {
      data: value,
      timestamp: Date.now(),
      url: key,
    };

    try {
      const response = new Response(JSON.stringify(cachedResponse), {
        headers: { 'Content-Type': 'application/json' },
      });
      await cache.put(key, response);
      
      // مدیریت محدودیت تعداد
      if (config?.maxEntries) {
        await this.enforceMaxEntries(cache, config.maxEntries);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to cache ${key}:`, error);
      return false;
    }
  }

  public async get(key: string, cacheName: string = 'api-cache'): Promise<any | null> {
    const cache = await this.getCache(cacheName);
    if (!cache) return null;

    try {
      const response = await cache.match(key);
      if (!response) return null;

      const cachedResponse: CachedResponse = await response.json();
      const config = this.configs.get(cacheName);

      // بررسی انقضای کش
      if (config?.maxAgeSeconds) {
        const ageInSeconds = (Date.now() - cachedResponse.timestamp) / 1000;
        if (ageInSeconds > config.maxAgeSeconds) {
          await this.delete(key, cacheName);
          return null;
        }
      }

      return cachedResponse.data;
    } catch (error) {
      console.error(`Failed to get cache for ${key}:`, error);
      return null;
    }
  }

  public async delete(key: string, cacheName: string = 'api-cache'): Promise<boolean> {
    const cache = await this.getCache(cacheName);
    if (!cache) return false;

    try {
      await cache.delete(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete cache for ${key}:`, error);
      return false;
    }
  }

  public async clear(cacheName: string): Promise<boolean> {
    const cache = await this.getCache(cacheName);
    if (!cache) return false;

    try {
      const keys = await cache.keys();
      for (const request of keys) {
        await cache.delete(request);
      }
      return true;
    } catch (error) {
      console.error(`Failed to clear cache ${cacheName}:`, error);
      return false;
    }
  }

  public async clearAll(): Promise<void> {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      await caches.delete(name);
    }
    this.caches.clear();
  }

  private async enforceMaxEntries(cache: Cache, maxEntries: number): Promise<void> {
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const toDelete = keys.slice(0, keys.length - maxEntries);
      for (const request of toDelete) {
        await cache.delete(request);
      }
    }
  }

  public async getCacheStats(cacheName: string): Promise<{ size: number; keys: string[] } | null> {
    const cache = await this.getCache(cacheName);
    if (!cache) return null;

    const keys = await cache.keys();
    const urls = keys.map(request => request.url);
    
    return {
      size: keys.length,
      keys: urls,
    };
  }
}

export const cacheManager = new CacheManager();