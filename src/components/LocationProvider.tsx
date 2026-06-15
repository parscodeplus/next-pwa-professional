// src/components/LocationProvider.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLocation, UseLocationReturn } from '../hooks/useLocation';

const LocationContext = createContext<UseLocationReturn | null>(null);

export interface LocationProviderProps {
  children: ReactNode;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchMode?: boolean;
  autoReverseGeocode?: boolean;
  enableIpFallback?: boolean;
  throttleInterval?: number;
  lowAccuracyThreshold?: number | null;
  maxWatchErrors?: number;
  disableFallback?: boolean;
}

export function LocationProvider({
  children,
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 0,
  watchMode = false,
  autoReverseGeocode = true,
  enableIpFallback = false,
  throttleInterval = 0,
  lowAccuracyThreshold = null,
  maxWatchErrors = 5,
  disableFallback = false,
}: LocationProviderProps) {
  const locationData = useLocation({
    enableHighAccuracy,
    timeout,
    maximumAge,
    watchMode,
    autoReverseGeocode,
    enableIpFallback,
    throttleInterval,
    lowAccuracyThreshold: lowAccuracyThreshold === null ? undefined : lowAccuracyThreshold,
    maxWatchErrors,
    disableFallback,
  });

  return (
    <LocationContext.Provider value={locationData}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext(): UseLocationReturn {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}