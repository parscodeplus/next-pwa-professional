// src/components/InstallPrompt.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallPromptProps {
  customText?: {
    title?: string;
    description?: string;
    installButton?: string;
    dismissButton?: string;
  };
  position?: 'bottom' | 'top' | 'center';
  autoShowDelay?: number; // milliseconds
}

export function InstallPrompt({ 
  customText = {},
  position = 'bottom',
  autoShowDelay = 1000,
}: InstallPromptProps) {
  const { showPrompt, installPrompt, dismissPrompt, isInstalled } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [hasAutoShown, setHasAutoShown] = useState(false);

  const defaultText = {
    title: 'نصب برنامه',
    description: 'برای تجربه بهتر، برنامه را روی دستگاه خود نصب کنید',
    installButton: 'نصب',
    dismissButton: 'بعداً',
  };

  const text = { ...defaultText, ...customText };

  useEffect(() => {
    if (showPrompt && !hasAutoShown && !isInstalled) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasAutoShown(true);
      }, autoShowDelay);
      
      return () => clearTimeout(timer);
    }
  }, [showPrompt, hasAutoShown, autoShowDelay, isInstalled]);

  if (!isVisible || isInstalled) return null;

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt();
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setIsVisible(false);
  };

  const positionClasses = {
    bottom: 'bottom-4 left-4 right-4',
    top: 'top-4 left-4 right-4',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 animate-in slide-in-from-bottom-4 duration-300`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          {/* آیکون */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </div>
          
          {/* محتوا */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {text.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {text.description}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {text.installButton}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                {text.dismissButton}
              </button>
            </div>
          </div>
          
          {/* دکمه بستن */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}