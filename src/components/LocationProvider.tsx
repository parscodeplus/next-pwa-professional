// src/components/LocationProvider.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLocation, UseLocationReturn } from '../hooks/useLocation';

const LocationContext = createContext<UseLocationReturn | null>(null);

export interface LocationProviderProps {
  children: ReactNode;
  enableHighAccuracy?: boolean;
  timeout?: number;
  watchMode?: boolean;
  autoReverseGeocode?: boolean;
}

export function LocationProvider({
  children,
  enableHighAccuracy = true,
  timeout = 10000,
  watchMode = false,
  autoReverseGeocode = true,
}: LocationProviderProps) {
  const locationData = useLocation({
    enableHighAccuracy,
    timeout,
    watchMode,
    autoReverseGeocode,
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