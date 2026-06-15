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
  getLocationByIp,
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
  enableIpFallback?: boolean;
  throttleInterval?: number;
  lowAccuracyThreshold?: number;
  maxWatchErrors?: number;
  maxRetries?: number;
  disableFallback?: boolean;
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
    timeout = 15000,
    maximumAge = 0,
    watchMode = false,
    cacheMaxAge = 5 * 60 * 1000,
    autoReverseGeocode = true,
    enableFallback = true,
    enableIpFallback = false,
    throttleInterval = 0,
    lowAccuracyThreshold,
    maxWatchErrors = 5,
    maxRetries = 3,
    disableFallback = false,
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<LocationErrorInfo | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [watchErrorCount, setWatchErrorCount] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const isGettingLocationRef = useRef(false);
  const cachedLocationRef = useRef<LocationData | null>(null);
  const getCurrentLocationPromiseRef = useRef<Promise<LocationData | null> | null>(null);
  const lastWatchTimestampRef = useRef<number>(0);

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

  const getIpLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!enableIpFallback) return null;
    const ipData = await getLocationByIp();
    if (ipData) {
      return {
        latitude: ipData.latitude,
        longitude: ipData.longitude,
        accuracy: 5000,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: Date.now(),
      };
    }
    return null;
  }, [enableIpFallback]);

  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'prompt';
    }
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermission(result.state);
      result.addEventListener('change', () => setPermission(result.state));
      return result.state;
    } catch {
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
        (err) => {
          setError(formatLocationError(err));
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
    console.log(`📍 موقعیت ${isHighAccuracy ? 'دقیق' : 'تخمینی'} دریافت شد:`, newLocation);
    setLocation(newLocation);
    setError(null);
    setLoading(false);
    setIsRetrying(false);
    setRetryCount(0);
    isGettingLocationRef.current = false;
    if (isHighAccuracy) {
      saveLocationToCache(newLocation);
      cachedLocationRef.current = newLocation;
    }
    if (autoReverseGeocode && isHighAccuracy) {
      reverseGeocode(newLocation.latitude, newLocation.longitude).then((addr) => {
        if (isMountedRef.current) setAddress(addr);
      });
    }
  }, [autoReverseGeocode]);

  const handleError = useCallback((error: GeolocationPositionError, isRetry: boolean = false) => {
    if (!isMountedRef.current) return;
    console.warn('📍 خطا در دریافت موقعیت:', error.code, error.message);
    if (error.code === 3) {
      const cached = getCachedLocation();
      if (cached && isLocationCacheValid(30000)) {
        setLocation(cached);
        setError(null);
        setLoading(false);
        isGettingLocationRef.current = false;
        return;
      }
    }
    const formattedError = formatLocationError(error);
    setError(formattedError);
    if (!isRetry) setLoading(false);
    isGettingLocationRef.current = false;
    if (isRetry) setIsRetrying(false);
  }, [getCachedLocation]);

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
          const cached = getCachedLocation();
          resolve(cached);
        }
      }, 10000);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
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
        (err) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
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
  }, [getCachedLocation, updateLocation]);

  const getCurrentLocation = useCallback((): Promise<LocationData | null> => {
    if (getCurrentLocationPromiseRef.current) {
      return getCurrentLocationPromiseRef.current;
    }
    const promise = new Promise<LocationData | null>((resolve) => {
      if (isGettingLocationRef.current) {
        resolve(null);
        return;
      }
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        handleError({ code: 2, message: 'Geolocation not supported', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
        resolve(null);
        return;
      }
      isGettingLocationRef.current = true;
      setLoading(true);
      setError(null);
      let timeoutId: NodeJS.Timeout;
      let isResolved = false;
      const geoOptions = { enableHighAccuracy: true, timeout, maximumAge: 0 };
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          isGettingLocationRef.current = false;
          setLoading(false);
          const cached = getCachedLocation();
          if (cached) {
            setLocation(cached);
            resolve(cached);
          } else {
            handleError({ code: 3, message: 'Timeout expired', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
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
        (err) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            handleError(err);
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
  }, [timeout, handleError, updateLocation, getCachedLocation]);

  const getLocationWithFallback = useCallback(async (): Promise<LocationData | null> => {
    if (disableFallback) {
      return await getCurrentLocation();
    }
    const cached = getCachedLocation();
    if (cached && !watchMode) {
      setLocation(cached);
      setLoading(false);
    }
    try {
      const high = await getCurrentLocation();
      if (high) {
        if (lowAccuracyThreshold && high.accuracy > lowAccuracyThreshold) {
          const retryHigh = await getCurrentLocation();
          if (retryHigh && retryHigh.accuracy <= lowAccuracyThreshold) {
            return retryHigh;
          }
        }
        return high;
      }
    } catch (e) {
      // ignore
    }
    if (enableFallback) {
      const low = await getLocationWithLowAccuracy();
      if (low) return low;
    }
    if (cached) return cached;
    const ip = await getIpLocation();
    if (ip) return ip;
    setError({
      code: 'POSITION_UNAVAILABLE',
      message: 'امکان دریافت موقعیت مکانی وجود ندارد.',
    });
    setLoading(false);
    return null;
  }, [disableFallback, getCurrentLocation, getLocationWithLowAccuracy, getCachedLocation, getIpLocation, enableFallback, lowAccuracyThreshold, watchMode]);

  const retry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setError({
        code: 'TIMEOUT',
        message: 'امکان دریافت موقعیت مکانی وجود ندارد. لطفاً دسترسی GPS را بررسی کنید.',
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

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setWatchId(null);
    }
  }, []);

  const startWatching = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      handleError({ code: 2, message: 'Geolocation not supported', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    const successHandler = (position: GeolocationPosition) => {
      const now = Date.now();
      if (throttleInterval > 0 && now - lastWatchTimestampRef.current < throttleInterval) return;
      lastWatchTimestampRef.current = now;
      setWatchErrorCount(0);
      updateLocation(position, true);
    };
    const errorHandler = (err: GeolocationPositionError) => {
      setWatchErrorCount(prev => prev + 1);
      if (watchErrorCount + 1 >= maxWatchErrors) {
        stopWatching();
        setError({
          code: 'POSITION_UNAVAILABLE',
          message: 'امکان دریافت موقعیت مکانی وجود ندارد. لطفاً بعداً تلاش کنید.',
        });
      } else {
        handleError(err);
      }
    };
    const id = navigator.geolocation.watchPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
    watchIdRef.current = id;
    setWatchId(id);
  }, [updateLocation, handleError, throttleInterval, maxWatchErrors, watchErrorCount, stopWatching]);

  const refreshAddress = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    const addr = await reverseGeocode(location.latitude, location.longitude);
    if (isMountedRef.current) setAddress(addr);
    setLoading(false);
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

  const isWithinRadiusOf = useCallback((centerLat: number, centerLon: number, radiusKm: number): boolean => {
    if (!location) return false;
    return isWithinRadius(location.latitude, location.longitude, centerLat, centerLon, radiusKm);
  }, [location]);

  useEffect(() => {
    isMountedRef.current = true;
    const init = async () => {
      await checkPermission();
      const cached = getCachedLocation();
      if (cached) {
        setLocation(cached);
        setLoading(false);
      }
      if (watchMode) {
        startWatching();
      } else {
        getLocationWithFallback();
      }
    };
    init();
    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [watchMode, startWatching, getLocationWithFallback, checkPermission, getCachedLocation, stopWatching]);

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