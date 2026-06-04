// src/components/NetworkStatus.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  Signal,
  X,
  AlertCircle,
  Gauge,
  Network,
  Zap,
  Download,
} from 'lucide-react';

export interface NetworkStatusProps {
  showBanner?: boolean;
  showWidget?: boolean;
  widgetPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  position?: 'top' | 'bottom';
  autoHideDelay?: number;
  showDetails?: boolean;
  onStatusChange?: (isOnline: boolean, info: any) => void;
  customMessages?: {
    online?: string;
    offline?: string;
    slow?: string;
    backOnline?: string;
  };
  theme?: 'light' | 'dark' | 'auto';
}

export function NetworkStatus({
  showBanner = false,
  showWidget = false,
  widgetPosition = 'top-right',
  position = 'top',
  autoHideDelay = 3000,
  showDetails = true,
  onStatusChange,
  customMessages = {},
  theme = 'auto',
}: NetworkStatusProps) {
  
  const [isOnline, setIsOnline] = useState(true);
  const [showBannerState, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'online' | 'offline' | 'slow'>('online');
  const [details, setDetails] = useState<{ speed: number; quality: string } | null>(null);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [isClient, setIsClient] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  // اگر هیچکدام فعال نیست، اصلاً رندر نکن
  if (!showBanner && !showWidget) {
    return null;
  }

  const clearHideTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const showBannerWithTimeout = (type: 'online' | 'offline' | 'slow', duration?: number) => {
    if (!isMountedRef.current) return;
    
    clearHideTimeout();
    setBannerType(type);
    setShowBanner(true);
    
    if (type !== 'offline' && duration !== undefined && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setShowBanner(false);
        }
      }, duration);
    }
  };

  const updateFromConnection = () => {
    if (typeof window === 'undefined') return;
    
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection;
    
    if (connection && showWidget) {
      const downlink = connection.downlink || null;
      let quality = 'unknown';
      if (downlink !== null) {
        if (downlink < 1) quality = 'very-slow';
        else if (downlink < 2) quality = 'slow';
        else if (downlink < 5) quality = 'fair';
        else if (downlink < 10) quality = 'good';
        else quality = 'excellent';
      }
      
      setDetails({ speed: downlink || 0, quality });
      setEffectiveType(connection.effectiveType || null);
    }
  };

  const handleOnline = () => {
    if (!isMountedRef.current) return;
    
    setIsOnline(true);
    updateFromConnection();
    
    if (showBanner) {
      showBannerWithTimeout('online', autoHideDelay);
    }
    
    onStatusChange?.(true, { isOnline: true });
  };

  const handleOffline = () => {
    if (!isMountedRef.current) return;
    
    setIsOnline(false);
    
    if (showBanner) {
      showBannerWithTimeout('offline');
    }
    
    onStatusChange?.(false, { isOnline: false });
  };

  // Client-side setup
  useEffect(() => {
    setIsClient(true);
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      clearHideTimeout();
    };
  }, []);

  // Theme setup
  useEffect(() => {
    if (!isClient) return;
    
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e: MediaQueryListEvent) => {
        setCurrentTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setCurrentTheme(theme === 'dark' ? 'dark' : 'light');
    }
  }, [theme, isClient]);

  // Initial online status
  useEffect(() => {
    if (!isClient) return;
    
    const online = navigator.onLine;
    setIsOnline(online);
    updateFromConnection();
  }, [isClient]);

  // Event listeners
  useEffect(() => {
    if (!isClient) return;
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection;
    if (connection && showWidget) {
      connection.addEventListener('change', updateFromConnection);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection && showWidget) {
        connection.removeEventListener('change', updateFromConnection);
      }
    };
  }, [isClient, showWidget]);

  if (!isClient) return null;

  const getWidgetPositionClass = () => {
    switch (widgetPosition) {
      case 'top-left': return 'top-2 left-2';
      case 'top-right': return 'top-2 right-2';
      case 'bottom-left': return 'bottom-2 left-2';
      case 'bottom-right': return 'bottom-2 right-2';
      default: return 'top-2 right-2';
    }
  };

  const getColors = () => {
    if (bannerType === 'online') {
      return currentTheme === 'dark' 
        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
        : 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    }
    if (bannerType === 'slow') {
      return currentTheme === 'dark'
        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
        : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
    }
    return currentTheme === 'dark'
      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
      : 'bg-gradient-to-r from-red-500 to-red-600 text-white';
  };

  const getMessage = () => {
    if (bannerType === 'online') {
      return customMessages.online || '✅ اتصال اینترنت برقرار شد';
    }
    if (bannerType === 'slow') {
      return customMessages.slow || '⚠️ اتصال اینترنت شما کند است';
    }
    if (bannerType === 'offline') {
      return customMessages.offline || '🔌 عدم دسترسی به اینترنت';
    }
    return customMessages.backOnline || '🔄 اتصال اینترنت برقرار شد';
  };

  const shouldShowBanner = showBanner && (showBannerState || !isOnline);
  const shouldShowWidget = showWidget && isOnline && details;

  return (
    <>
      {shouldShowBanner && (
        <div className={`fixed z-50 left-0 right-0 ${position === 'top' ? 'top-0' : 'bottom-0'} ${getColors()} shadow-xl`}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">
                  {bannerType === 'online' && <Wifi className="w-5 h-5" />}
                  {bannerType === 'slow' && <AlertCircle className="w-5 h-5" />}
                  {bannerType === 'offline' && <WifiOff className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm sm:text-base">{getMessage()}</p>
                </div>
                {!isOnline && (
                  <button onClick={() => setShowBanner(false)} className="flex-shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {shouldShowWidget && (
        <div className={`fixed ${getWidgetPositionClass()} z-40 bg-white dark:bg-gray-800 rounded-full shadow-lg px-3 py-1.5 border border-gray-200 dark:border-gray-700 flex items-center gap-2`}>
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium">{details.speed.toFixed(1)} Mbps</span>
          </div>
          {effectiveType && (
            <div className="border-l border-gray-300 dark:border-gray-600 pl-2">
              <span className="text-xs uppercase">{effectiveType === '4g' ? '4G' : effectiveType === 'wifi' ? 'WiFi' : effectiveType}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}