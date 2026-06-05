// src/components/OnboardingSlider.tsx
'use client';

import React, { useState, useEffect, useRef, TouchEvent, MouseEvent } from 'react';
import { useOnboarding, UseOnboardingReturn } from '../hooks/useOnboarding';
import { OnboardingSlide, OnboardingConfig } from '../lib/onboardingStorage';

export interface OnboardingSliderProps {
  customConfig?: Partial<OnboardingConfig>;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export function OnboardingSlider({ 
  customConfig, 
  onComplete, 
  onSkip, 
  className = '' 
}: OnboardingSliderProps) {
  const {
    slides,
    currentIndex,
    isOpen,
    loading,
    next,
    previous,
    goTo,
    complete,
    hide,
    config,
  } = useOnboarding(customConfig);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // حداقل فاصله برای تشخیص سوایپ
  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < slides.length - 1) {
      next();
    }
    if (isRightSwipe && currentIndex > 0) {
      previous();
    }
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    next();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    previous();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSkip = () => {
    hide();
    onSkip?.();
  };

  const handleComplete = () => {
    complete();
    onComplete?.();
  };

  const getCurrentSlide = (): OnboardingSlide | undefined => {
    return slides[currentIndex];
  };

  if (loading || !isOpen) return null;

  const currentSlide = getCurrentSlide();
  if (!currentSlide) return null;

  const isLastSlide = currentIndex === slides.length - 1;
  const bgColor = currentSlide.backgroundColor || '#6366f1';
  const primaryColor = currentSlide.primaryColor || '#ffffff';

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500 ${className}`}
      style={{ backgroundColor: bgColor }}
      onTouchStart={config.allowSwipe ? onTouchStart : undefined}
      onTouchMove={config.allowSwipe ? onTouchMove : undefined}
      onTouchEnd={config.allowSwipe ? onTouchEnd : undefined}
      ref={containerRef}
    >
      {/* دکمه Skip */}
      {config.showSkip && !isLastSlide && (
        <button
          onClick={handleSkip}
          className="absolute top-4 left-4 z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-80"
          style={{ color: primaryColor }}
        >
          {config.skipButtonText}
        </button>
      )}

      {/* محتوای اصلی */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        {/* تصویر یا آیکون */}
        <div className="mb-8 animate-fade-in-up">
          {currentSlide.image ? (
            <img 
              src={currentSlide.image} 
              alt={currentSlide.title}
              className="w-64 h-64 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : currentSlide.icon ? (
            <div className="w-32 h-32 mx-auto flex items-center justify-center rounded-full bg-white/20">
              <span className="text-6xl">{currentSlide.icon}</span>
            </div>
          ) : (
            <div className="w-32 h-32 mx-auto flex items-center justify-center rounded-full bg-white/20">
              <span className="text-6xl">🎉</span>
            </div>
          )}
        </div>

        {/* عنوان */}
        <h2 
          className="text-2xl md:text-3xl font-bold text-center mb-4 animate-fade-in-up"
          style={{ color: primaryColor }}
        >
          {currentSlide.title}
        </h2>

        {/* توضیحات */}
        <p 
          className="text-base md:text-lg text-center opacity-90 animate-fade-in-up"
          style={{ color: primaryColor }}
        >
          {currentSlide.description}
        </p>

        {/* دکمه اکشن مخصوص اسلاید (اختیاری) */}
        {currentSlide.buttonText && !isLastSlide && (
          <button
            onClick={handleNext}
            className="mt-8 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: primaryColor, color: bgColor }}
          >
            {currentSlide.buttonText}
          </button>
        )}
      </div>

      {/* دکمه‌های ناوبری پایین */}
      <div className="w-full pb-8 px-6">
        {/* نقاط نشانگر (Dots) */}
        {config.showDots && slides.length > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex 
                    ? 'w-8 h-2' 
                    : 'w-2 h-2 opacity-50'
                }`}
                style={{ backgroundColor: primaryColor }}
              />
            ))}
          </div>
        )}

        {/* دکمه‌های قبلی/بعدی/پایان */}
        <div className="flex justify-between gap-4">
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 border hover:opacity-80"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              {config.backButtonText}
            </button>
          )}
          
          {!isLastSlide ? (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: primaryColor, color: bgColor }}
            >
              {config.nextButtonText}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: primaryColor, color: bgColor }}
            >
              {config.finalButtonText}
            </button>
          )}
        </div>
      </div>

      {/* استایل‌های انیمیشن */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// تابع کمکی برای ایجاد اسلایدها
export function createOnboardingSlides(slides: Partial<OnboardingSlide>[]): OnboardingSlide[] {
  return slides.map((slide, index) => ({
    id: slide.id || `slide-${index}`,
    title: slide.title || '',
    description: slide.description || '',
    image: slide.image,
    icon: slide.icon,
    backgroundColor: slide.backgroundColor,
    primaryColor: slide.primaryColor,
    buttonText: slide.buttonText,
    action: slide.action,
  }));
}

// تابع کمکی برای ذخیره تنظیمات در localStorage
export function presetOnboardingConfig(config: Partial<OnboardingConfig>): void {
  if (typeof window !== 'undefined') {
    const { saveOnboardingConfig } = require('../lib/onboardingStorage');
    const finalConfig = { ...require('../lib/onboardingStorage').DEFAULT_CONFIG, ...config };
    saveOnboardingConfig(finalConfig);
  }
}