// src/components/LocationGuide.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Navigation, Settings, AlertTriangle, WifiOff, BatteryCharging, X } from 'lucide-react';
import { useLocationContext } from './LocationProvider';

export interface LocationGuideProps {
  onClose?: () => void;
  onEnable?: () => void;
  className?: string;
  zIndex?: number;
  onlyShowOnPages?: string[]; // جدید: فقط در صفحات خاص نمایش بده
  currentPath?: string; // جدید: مسیر فعلی
}

export function LocationGuide({ 
  onClose, 
  onEnable, 
  className = '',
  zIndex = 99999,
  onlyShowOnPages = [], // جدید
  currentPath = '' // جدید
}: LocationGuideProps) {
  const { error, retry, permission } = useLocationContext();
  const [os, setOs] = useState<string>('unknown');
  const [showGuide, setShowGuide] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) setOs('windows');
    else if (userAgent.includes('mac')) setOs('mac');
    else if (userAgent.includes('iphone') || userAgent.includes('ipad')) setOs('ios');
    else if (userAgent.includes('android')) setOs('android');
    else setOs('other');
    
    // =============================================
    // ❌ حذف قفل اسکرول - دیگر اسکرول را مسدود نمی‌کنیم
    // =============================================
    // if (typeof document !== 'undefined') {
    //   document.body.style.overflow = 'hidden';
    // }
    
    return () => {
      setMounted(false);
      // =============================================
      // ❌ حذف بازیابی اسکرول - دیگر نیازی نیست
      // =============================================
      // if (typeof document !== 'undefined') {
      //   document.body.style.overflow = '';
      // }
    };
  }, []);

  // =============================================
  // ✅ بررسی اینکه آیا در صفحات مشخص شده هستیم
  // =============================================
  const shouldShowOnCurrentPage = () => {
    if (onlyShowOnPages.length === 0) return true;
    return onlyShowOnPages.some(page => currentPath.includes(page));
  };

  const handleCloseWithAnimation = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setShowGuide(false);
      onClose?.();
      setIsAnimatingOut(false);
    }, 200);
  };

  const handleEnableWithAnimation = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      retry();
      onEnable?.();
      setShowGuide(false);
      setIsAnimatingOut(false);
    }, 200);
  };

  // =============================================
  // ✅ اگر در صفحات مشخص شده نباشیم، نمایش نده
  // =============================================
  if (!mounted || !error || permission === 'granted' || !showGuide || !shouldShowOnCurrentPage()) {
    return null;
  }

  const isPermissionDenied = error.code === 'PERMISSION_DENIED';
  const isTimeout = error.code === 'TIMEOUT';
  const isUnavailable = error.code === 'POSITION_UNAVAILABLE';

  const getInstructions = () => {
    if (os === 'android') {
      return {
        title: 'فعال‌سازی GPS در اندروید',
        icon: <Settings className="w-5 h-5" />,
        steps: [
          'به تنظیمات گوشی بروید',
          'وارد بخش "برنامه‌ها" یا "Apps" شوید',
          `برنامه "${document.title || 'برنامه'}" را پیدا کنید`,
          'وارد بخش "مجوزها" شوید',
          'گزینه "موقعیت مکانی" را روی "اجازه" یا "فقط هنگام استفاده" قرار دهید',
        ],
      };
    } else if (os === 'ios') {
      return {
        title: 'فعال‌سازی موقعیت در iOS',
        icon: <Settings className="w-5 h-5" />,
        steps: [
          'به تنظیمات (Settings) گوشی بروید',
          'به پایین بروید تا نام برنامه را ببینید',
          `روی "${document.title || 'برنامه'}" کلیک کنید`,
          'گزینه "موقعیت مکانی" را روی "هنگام استفاده" قرار دهید',
        ],
      };
    } else {
      return {
        title: 'فعال‌سازی دسترسی موقعیت',
        icon: <Navigation className="w-5 h-5" />,
        steps: [
          'روی آیکون قفل یا اطلاعات سایت در نوار آدرس کلیک کنید',
          'مجوز موقعیت مکانی را به "اجازه" تغییر دهید',
          'صفحه را refresh کنید',
        ],
      };
    }
  };

  const instructions = getInstructions();

  const getErrorIcon = () => {
    if (isPermissionDenied) return <AlertTriangle className="w-12 h-12 text-amber-500" />;
    if (isTimeout) return <BatteryCharging className="w-12 h-12 text-blue-500" />;
    if (isUnavailable) return <WifiOff className="w-12 h-12 text-red-500" />;
    return <Navigation className="w-12 h-12 text-brand-500" />;
  };

  const getErrorTitle = () => {
    if (isPermissionDenied) return 'دسترسی به موقعیت رد شد';
    if (isTimeout) return 'دریافت موقعیت زمان‌بر است';
    if (isUnavailable) return 'GPS در دسترس نیست';
    return 'خطا در دریافت موقعیت';
  };

  const getErrorDescription = () => {
    if (isPermissionDenied) return 'برای استفاده از خدمات محلی، لطفاً دسترسی موقعیت را فعال کنید.';
    if (isTimeout) return 'ممکن است در محیط بسته باشید یا GPS ضعیف باشد.';
    if (isUnavailable) return 'لطفاً مطمئن شوید GPS گوشی شما فعال است.';
    return 'مشکلی در دریافت موقعیت مکانی به وجود آمده است.';
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        zIndex: zIndex,
        pointerEvents: 'none',
        animation: isAnimatingOut ? 'fadeOut 0.2s ease-out forwards' : 'fadeIn 0.2s ease-out forwards'
      }}
    >
      {/* backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
        onClick={handleCloseWithAnimation}
      />
      
      {/* modal content */}
      <div 
        className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden pointer-events-auto ${className}`}
        style={{ 
          pointerEvents: 'auto',
          animation: isAnimatingOut ? 'slideOut 0.2s ease-out forwards' : 'slideIn 0.2s ease-out forwards'
        }}
      >
        {/* هدر با گرادیانت */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleCloseWithAnimation}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-4 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950/50 dark:to-brand-900/30 rounded-full">
              {getErrorIcon()}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {getErrorTitle()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getErrorDescription()}
            </p>
          </div>
        </div>

        {/* راهنمای فعال‌سازی */}
        <div className="p-6">
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
                {instructions.icon}
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                {instructions.title}
              </h4>
            </div>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mr-6">
              {instructions.steps.map((step, idx) => (
                <li key={idx} className="list-decimal">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* دکمه‌های اقدام */}
          <div className="flex gap-3">
            <button
              onClick={handleEnableWithAnimation}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all active:scale-95"
            >
              تلاش مجدد
            </button>
            <button
              onClick={handleCloseWithAnimation}
              className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-all active:scale-95"
            >
              بعداً
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
            موقعیت مکانی فقط برای ارائه خدمات بهتر استفاده می‌شود.
          </p>
        </div>
      </div>
    </div>
  );

  // اضافه کردن استایل‌های انیمیشن به document
  if (typeof document !== 'undefined' && !document.getElementById('location-guide-styles')) {
    const style = document.createElement('style');
    style.id = 'location-guide-styles';
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        to {
          opacity: 0;
          transform: scale(0.95) translateY(20px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}