// src/components/LocationGuide.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useLocationContext } from './LocationProvider';

export interface LocationGuideProps {
  onClose?: () => void;
  onEnable?: () => void;
  className?: string;
}

export function LocationGuide({ onClose, onEnable, className = '' }: LocationGuideProps) {
  const { error, retry, permission } = useLocationContext();
  const [os, setOs] = useState<string>('unknown');
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) setOs('windows');
    else if (userAgent.includes('mac')) setOs('mac');
    else if (userAgent.includes('iphone') || userAgent.includes('ipad')) setOs('ios');
    else if (userAgent.includes('android')) setOs('android');
    else setOs('other');
  }, []);

  // اگر خطایی وجود نداشته باشد یا مجوز قبلاً داده شده باشد، چیزی نمایش نده
  if (!error || permission === 'granted' || !showGuide) return null;

  const isPermissionDenied = error.code === 'PERMISSION_DENIED';
  const isTimeout = error.code === 'TIMEOUT';
  const isUnavailable = error.code === 'POSITION_UNAVAILABLE';

  const getInstructions = () => {
    if (os === 'android') {
      return {
        title: 'فعال‌سازی GPS در اندروید',
        steps: [
          'به تنظیمات گوشی بروید',
          'وارد بخش "مکان" (Location) شوید',
          'مطمئن شوید دسترسی موقعیت روشن است',
          'در مرورگر Chrome، به تنظیمات سایت رفته و مجوز موقعیت را به "اجازه" تغییر دهید',
        ],
      };
    } else if (os === 'ios') {
      return {
        title: 'فعال‌سازی موقعیت در iOS',
        steps: [
          'به تنظیمات بروید > حریم خصوصی > موقعیت مکانی',
          'سرویس‌های موقعیت را روشن کنید',
          'برای مرورگر Safari، دسترسی را به "هنگام استفاده" تغییر دهید',
        ],
      };
    } else {
      return {
        title: 'فعال‌سازی دسترسی موقعیت',
        steps: [
          'روی آیکون قفل یا اطلاعات سایت در نوار آدرس کلیک کنید',
          'مجوز موقعیت مکانی را به "اجازه" تغییر دهید',
          'صفحه را refresh کنید',
        ],
      };
    }
  };

  const instructions = getInstructions();

  const handleClose = () => {
    setShowGuide(false);
    onClose?.();
  };

  const handleEnable = () => {
    retry();
    onEnable?.();
    setShowGuide(false);
  };

  return (
    <>
      {/* backdrop overlay */}
      <div 
        className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm transition-all duration-300"
        onClick={handleClose}
      />
      
      {/* modal content */}
      <div className={`fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none ${className}`}>
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl pointer-events-auto transform transition-all duration-300 animate-in fade-in zoom-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              📍 دسترسی به موقعیت مکانی
            </h3>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
            {isPermissionDenied && 'دسترسی به موقعیت مکانی رد شده است.'}
            {isTimeout && 'دریافت موقعیت زمان‌بر است.'}
            {isUnavailable && 'GPS در دسترس نیست.'}
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{instructions.title}</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {instructions.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEnable}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              تلاش مجدد
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              بعداً
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            موقعیت مکانی فقط برای ارائه خدمات بهتر استفاده می‌شود.
          </p>
        </div>
      </div>
    </>
  );
}