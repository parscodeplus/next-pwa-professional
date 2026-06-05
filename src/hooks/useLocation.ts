// src/hooks/useLocation.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LocationData,
  LocationErrorInfo,
  formatLocationError,
  reverseGeocode,
  AddressData,
  saveLocationToCache,
  getLocationFromCache,
  isLocationCacheValid,
  calculateDistance,
  isWithinRadius,
} from '../lib/locationUtils';

export type { LocationData, AddressData, LocationErrorInfo } from '../lib/locationUtils';

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchMode?: boolean;
  cacheMaxAge?: number;
  autoReverseGeocode?: boolean;
  enableFallback?: boolean;
  maxRetries?: number;
}

export interface UseLocationReturn {
  location: LocationData | null;
  address: AddressData | null;
  loading: boolean;
  error: LocationErrorInfo | null;
  watchId: number | null;
  getCurrentLocation: () => Promise<LocationData | null>;
  getLocationWithFallback: () => Promise<LocationData | null>;
  startWatching: () => void;
  stopWatching: () => void;
  refreshAddress: () => Promise<void>;
  clearCache: () => void;
  calculateDistanceTo: (lat: number, lon: number) => number | null;
  isWithinRadiusOf: (centerLat: number, centerLon: number, radiusKm: number) => boolean;
  permission: PermissionState | null;
  requestPermission: () => Promise<boolean>;
  retryCount: number;
  retry: () => void;
  isRetrying: boolean;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 15000, // افزایش به 15 ثانیه
    maximumAge = 0,
    watchMode = false,
    cacheMaxAge = 5 * 60 * 1000,
    autoReverseGeocode = true,
    enableFallback = true,
    maxRetries = 3,
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<LocationErrorInfo | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  
  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const isGettingLocationRef = useRef(false);
  const cachedLocationRef = useRef<LocationData | null>(null);
  const getCurrentLocationPromiseRef = useRef<Promise<LocationData | null> | null>(null);

  // دریافت موقعیت از کش
  const getCachedLocation = useCallback((): LocationData | null => {
    if (isLocationCacheValid(cacheMaxAge)) {
      const cached = getLocationFromCache();
      if (cached) {
        const locationData: LocationData = {
          latitude: cached.latitude,
          longitude: cached.longitude,
          accuracy: cached.accuracy,
          altitude: cached.altitude,
          altitudeAccuracy: cached.altitudeAccuracy,
          heading: cached.heading,
          speed: cached.speed,
          timestamp: cached.timestamp,
        };
        cachedLocationRef.current = locationData;
        return locationData;
      }
    }
    return null;
  }, [cacheMaxAge]);

  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'prompt';
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermission(result.state);
      
      result.addEventListener('change', () => {
        setPermission(result.state);
      });
      
      return result.state;
    } catch (error) {
      return 'prompt';
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setError({
          code: 'POSITION_UNAVAILABLE',
          message: 'مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند.',
        });
        resolve(false);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        () => {
          checkPermission().then(() => resolve(true));
        },
        (error) => {
          const formattedError = formatLocationError(error);
          setError(formattedError);
          resolve(false);
        }
      );
    });
  }, [checkPermission]);

  const updateLocation = useCallback((position: GeolocationPosition, isHighAccuracy: boolean = true) => {
    if (!isMountedRef.current) return;
    
    const newLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
    };
    
    console.log(`📍 موقعیت ${isHighAccuracy ? 'دقیق' : 'تخمینی'} دریافت شد:`, {
      lat: newLocation.latitude.toFixed(6),
      lng: newLocation.longitude.toFixed(6),
      accuracy: newLocation.accuracy,
    });
    
    setLocation(newLocation);
    setError(null);
    setLoading(false);
    setIsRetrying(false);
    setRetryCount(0);
    isGettingLocationRef.current = false;
    
    // فقط موقعیت‌های با دقت بالا رو کش کن
    if (isHighAccuracy) {
      saveLocationToCache(newLocation);
      cachedLocationRef.current = newLocation;
    }
    
    if (autoReverseGeocode && isHighAccuracy) {
      reverseGeocode(newLocation.latitude, newLocation.longitude).then((addressData) => {
        if (isMountedRef.current) {
          setAddress(addressData);
        }
      });
    }
  }, [autoReverseGeocode]);

  const handleError = useCallback((error: GeolocationPositionError, isRetry: boolean = false) => {
    if (!isMountedRef.current) return;
    
    console.warn('📍 خطا در دریافت موقعیت:', error.code, error.message);
    
    // اگر خطای timeout بود و کش معتبر وجود دارد، از کش استفاده کن
    if (error.code === 3) { // TIMEOUT
      const cached = getCachedLocation();
      if (cached && isLocationCacheValid(30000)) {
        console.log('📍 استفاده از موقعیت کش شده به دلیل timeout');
        setLocation(cached);
        setError(null);
        setLoading(false);
        isGettingLocationRef.current = false;
        return;
      }
    }
    
    const formattedError = formatLocationError(error);
    setError(formattedError);
    
    if (!isRetry) {
      setLoading(false);
    }
    
    isGettingLocationRef.current = false;
    
    if (isRetry) {
      setIsRetrying(false);
    }
  }, [getCachedLocation]);

  // دریافت موقعیت با دقت پایین (Fallback)
  const getLocationWithLowAccuracy = useCallback((): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }
      
      let timeoutId: NodeJS.Timeout;
      let isResolved = false;
      
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.log('📍 تلاش با دقت پایین: timeout');
          const cached = getCachedLocation();
          if (cached) {
            resolve(cached);
          } else {
            resolve(null);
          }
        }
      }, 10000);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            console.log('✅ موقعیت با دقت پایین دریافت شد');
            updateLocation(position, false);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp,
            });
          }
        },
        (error) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            console.warn('⚠️ خطا در دریافت موقعیت با دقت پایین:', error.message);
            const cached = getCachedLocation();
            resolve(cached);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 30000,
        }
      );
    });
  }, [updateLocation, getCachedLocation]);

  // دریافت موقعیت اصلی (با دقت بالا)
  const getCurrentLocation = useCallback((): Promise<LocationData | null> => {
    // اگر در حال دریافت هستیم، promise قبلی را برگردان
    if (getCurrentLocationPromiseRef.current) {
      return getCurrentLocationPromiseRef.current;
    }
    
    const promise = new Promise<LocationData | null>((resolve) => {
      if (isGettingLocationRef.current) {
        console.log('📍 در حال دریافت موقعیت، لطفاً صبر کنید...');
        resolve(null);
        return;
      }
      
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        handleError({
          code: 2,
          message: 'Geolocation not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
        resolve(null);
        return;
      }
      
      isGettingLocationRef.current = true;
      setLoading(true);
      setError(null);
      
      let timeoutId: NodeJS.Timeout;
      let isResolved = false;
      
      const geoOptions = {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0,
      };
      
      console.log('📍 درخواست موقعیت دقیق...', geoOptions);
      
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          isGettingLocationRef.current = false;
          setLoading(false);
          console.warn('📍 Timeout در دریافت موقعیت دقیق');
          
          // استفاده از موقعیت کش شده
          const cached = getCachedLocation();
          if (cached) {
            console.log('📍 استفاده از موقعیت کش شده');
            setLocation(cached);
            resolve(cached);
          } else {
            handleError({
              code: 3,
              message: 'Timeout expired',
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            });
            resolve(null);
          }
        }
      }, timeout + 1000);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            updateLocation(position, true);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp,
            });
          }
        },
        (error) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            handleError(error);
            resolve(null);
          }
        },
        geoOptions
      );
    });
    
    getCurrentLocationPromiseRef.current = promise;
    promise.finally(() => {
      if (getCurrentLocationPromiseRef.current === promise) {
        getCurrentLocationPromiseRef.current = null;
      }
    });
    
    return promise;
  }, [timeout, updateLocation, handleError, getCachedLocation]);

  // دریافت موقعیت با مکانیزم Fallback هوشمند
  const getLocationWithFallback = useCallback(async (): Promise<LocationData | null> => {
    // 1. ابتدا موقعیت ذخیره شده را نمایش بده
    const cachedLocation = getCachedLocation();
    if (cachedLocation) {
      console.log('📍 نمایش موقعیت ذخیره شده:', cachedLocation);
      setLocation(cachedLocation);
      setLoading(false);
    }
    
    // 2. تلاش برای دریافت موقعیت دقیق
    try {
      const result = await getCurrentLocation();
      if (result) {
        console.log('✅ موقعیت دقیق دریافت شد');
        return result;
      }
      throw new Error('GPS_FAILED');
    } catch (error) {
      console.warn('⚠️ دریافت موقعیت دقیق با مشکل مواجه شد، استفاده از روش جایگزین...');
      
      // 3. تلاش با دقت پایین
      const lowAccuracyLocation = await getLocationWithLowAccuracy();
      if (lowAccuracyLocation) {
        console.log('✅ موقعیت با دقت پایین دریافت شد');
        return lowAccuracyLocation;
      }
      
      // 4. اگر هیچکدام جواب نداد، از موقعیت ذخیره شده استفاده کن
      if (cachedLocation) {
        console.log('📍 استفاده از آخرین موقعیت ذخیره شده');
        return cachedLocation;
      }
      
      // 5. در نهایت خطا بده
      setError({
        code: 'POSITION_UNAVAILABLE',
        message: 'امکان دریافت موقعیت مکانی وجود ندارد. لطفاً GPS را فعال کرده و در فضای باز قرار بگیرید.',
      });
      setLoading(false);
      return null;
    }
  }, [getCachedLocation, getCurrentLocation, getLocationWithLowAccuracy]);

  const retry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setError({
        code: 'TIMEOUT',
        message: 'امکان دریافت موقعیت مکانی وجود ندارد. لطفاً:\n1. GPS را فعال کنید\n2. به فضای باز بروید\n3. دسترسی مرورگر را بررسی کنید',
      });
      return;
    }
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    setError(null);
    
    const result = await getLocationWithFallback();
    
    setIsRetrying(false);
    return result;
  }, [retryCount, maxRetries, getLocationWithFallback]);

  const startWatching = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      handleError({
        code: 2,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
      return;
    }
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    const id = navigator.geolocation.watchPosition(
      (position) => updateLocation(position, true),
      (error) => handleError(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
    
    watchIdRef.current = id;
    setWatchId(id);
  }, [updateLocation, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setWatchId(null);
    }
  }, []);

  const refreshAddress = useCallback(async () => {
    if (!location) return;
    
    setLoading(true);
    const addressData = await reverseGeocode(location.latitude, location.longitude);
    if (isMountedRef.current) {
      setAddress(addressData);
      setLoading(false);
    }
  }, [location]);

  const clearCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cached_location');
      cachedLocationRef.current = null;
    }
  }, []);

  const calculateDistanceTo = useCallback((lat: number, lon: number): number | null => {
    if (!location) return null;
    return calculateDistance(location.latitude, location.longitude, lat, lon);
  }, [location]);

  const isWithinRadiusOf = useCallback((
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): boolean => {
    if (!location) return false;
    return isWithinRadius(location.latitude, location.longitude, centerLat, centerLon, radiusKm);
  }, [location]);

  // مقداردهی اولیه
  useEffect(() => {
    isMountedRef.current = true;
    
    const init = async () => {
      await checkPermission();
      
      // ابتدا موقعیت کش شده را نمایش بده
      const cached = getCachedLocation();
      if (cached) {
        setLocation(cached);
        setLoading(false);
      }
      
      if (watchMode) {
        startWatching();
      } else {
        // دریافت موقعیت با مکانیزم fallback (غیرمسدود)
        getLocationWithFallback();
      }
    };
    
    init();
    
    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [watchMode, startWatching, getLocationWithFallback, checkPermission, getCachedLocation]);

  return {
    location,
    address,
    loading,
    error,
    watchId,
    getCurrentLocation,
    getLocationWithFallback,
    startWatching,
    stopWatching,
    refreshAddress,
    clearCache,
    calculateDistanceTo,
    isWithinRadiusOf,
    permission,
    requestPermission,
    retryCount,
    retry,
    isRetrying,
  };
}