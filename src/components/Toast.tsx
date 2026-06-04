// src/components/Toast.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X, Wifi, WifiOff, Gauge, Zap } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'network';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  icon?: React.ReactNode;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, icon?: React.ReactNode) => void;
  removeToast: (id: string) => void;
  showNetworkToast: (status: 'online' | 'offline' | 'slow' | 'back-online', speed?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- CSS Animations (Injected style) ---
const toastStyles = `
  @keyframes toast-enter {
    from { transform: translateY(-100%) scale(0.9); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes toast-exit {
    from { transform: translateY(0) scale(1); opacity: 1; }
    to { transform: translateY(-20px) scale(0.95); opacity: 0; }
  }
  @keyframes progress-shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
  .toast-enter { animation: toast-enter 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  .toast-exit { animation: toast-exit 0.3s ease-in forwards; }
`;

// آیکون‌های پیش‌فرض برای انواع پیام‌ها
const getDefaultIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-6 h-6 text-emerald-500" />;
    case 'error':
      return <XCircle className="w-6 h-6 text-rose-500" />;
    case 'warning':
      return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    case 'info':
      return <Info className="w-6 h-6 text-blue-500" />;
    case 'network':
      return <Wifi className="w-6 h-6 text-blue-500" />;
    default:
      return <Info className="w-6 h-6 text-blue-500" />;
  }
};

const ToastItem: React.FC<{ 
    toast: ToastData; 
    onRemove: (id: string) => void; 
}> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const startTimeRef = useRef<number>(Date.now());
    const remainingTimeRef = useRef<number>(toast.duration);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    }, [toast.id, onRemove]);

    const startTimer = useCallback(() => {
        if (toast.duration === 0) return; // عدم نمایش خودکار برای آفلاین
        
        startTimeRef.current = Date.now();
        
        if (progressRef.current) {
            progressRef.current.style.animationPlayState = 'running';
        }

        timerRef.current = setTimeout(() => {
            handleClose();
        }, remainingTimeRef.current);
    }, [toast.duration, handleClose]);

    const pauseTimer = useCallback(() => {
        if (toast.duration === 0) return;
        
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);

        if (progressRef.current) {
            progressRef.current.style.animationPlayState = 'paused';
        }
        setIsPaused(true);
    }, [toast.duration]);

    const resumeTimer = useCallback(() => {
        if (toast.duration === 0) return;
        
        setIsPaused(false);
        startTimer();
    }, [toast.duration, startTimer]);

    useEffect(() => {
        if (toast.duration > 0) {
            startTimer();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [toast.duration, startTimer]);

    const getColorClasses = () => {
        switch (toast.type) {
            case 'success':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
                    border: 'border-emerald-200 dark:border-emerald-800',
                    bar: 'bg-emerald-500'
                };
            case 'error':
                return {
                    bg: 'bg-rose-50 dark:bg-rose-950/40',
                    border: 'border-rose-200 dark:border-rose-800',
                    bar: 'bg-rose-500'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-950/40',
                    border: 'border-amber-200 dark:border-amber-800',
                    bar: 'bg-amber-500'
                };
            case 'network':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-950/40',
                    border: 'border-blue-200 dark:border-blue-800',
                    bar: 'bg-blue-500'
                };
            default:
                return {
                    bg: 'bg-blue-50 dark:bg-blue-950/40',
                    border: 'border-blue-200 dark:border-blue-800',
                    bar: 'bg-blue-500'
                };
        }
    };

    const styles = getColorClasses();
    const displayIcon = toast.icon || getDefaultIcon(toast.type);

    return (
        <div
            className={`
                relative w-full max-w-sm md:max-w-md mx-auto mb-3 rounded-2xl overflow-hidden shadow-xl border backdrop-blur-xl transition-all
                ${styles.bg} ${styles.border}
                ${isExiting ? 'toast-exit' : 'toast-enter'}
            `}
            onMouseEnter={() => { pauseTimer(); setIsPaused(true); }}
            onMouseLeave={() => { if (!isPaused) resumeTimer(); }}
            role="alert"
        >
            <div className="flex items-center gap-4 p-4">
                <div className="shrink-0 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                    {displayIcon}
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-white leading-5">
                        {toast.message}
                    </p>
                </div>

                <button 
                    onClick={handleClose}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label="بستن"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress Bar - فقط در صورتی که duration بیشتر از 0 باشد */}
            {toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700/50">
                    <div
                        ref={progressRef}
                        className={`h-full absolute left-0 rounded-r-full ${styles.bar}`}
                        style={{
                            animationName: 'progress-shrink',
                            animationDuration: `${toast.duration}ms`,
                            animationTimingFunction: 'linear',
                            animationFillMode: 'forwards',
                            animationPlayState: isPaused ? 'paused' : 'running'
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000, icon?: React.ReactNode) => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id, message, type, duration, icon }]);
        
        // Auto remove after duration (for manual close if duration is 0)
        if (duration === 0) {
            // برای پیام‌های مادام‌العمر (مثل آفلاین) تایمر خودکار نداریم
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showNetworkToast = useCallback((status: 'online' | 'offline' | 'slow' | 'back-online', speed?: number) => {
        console.log('📢 [Toast] showNetworkToast called:', { status, speed });
        
        const messages = {
            online: '✅ اتصال اینترنت برقرار شد',
            'back-online': '🔄 اتصال اینترنت بازیابی شد',
            offline: '🔌 قطعی اینترنت - برخی قابلیت‌ها محدود هستند',
            slow: `⚠️ سرعت اینترنت پایین است (${speed?.toFixed(1) || '?'} Mbps)`
        };
        
        const icons = {
            online: <Wifi className="w-6 h-6 text-emerald-500" />,
            'back-online': <Zap className="w-6 h-6 text-emerald-500" />,
            offline: <WifiOff className="w-6 h-6 text-rose-500" />,
            slow: <Gauge className="w-6 h-6 text-amber-500" />
        };
        
        const types = {
            online: 'success' as ToastType,
            'back-online': 'success' as ToastType,
            offline: 'error' as ToastType,
            slow: 'warning' as ToastType
        };
        
        // مدت زمان نمایش: برای آفلاین مادام‌العمر (0)، برای بقیه 5 ثانیه
        const duration = status === 'offline' ? 0 : 5000;
        
        showToast(messages[status], types[status], duration, icons[status]);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, removeToast, showNetworkToast }}>
            <style>{toastStyles}</style>
            {children}
            <div className="fixed top-0 left-0 right-0 z-[9999] p-4 flex flex-col items-center pointer-events-none">
                <div className="w-full pointer-events-auto max-w-md mx-auto">
                    {toasts.map((toast) => (
                        <ToastItem 
                            key={toast.id} 
                            toast={toast} 
                            onRemove={removeToast} 
                        />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// کامپوننت Toast ساده برای backward compatibility
export function ToastLegacy({ 
    message, 
    type = 'success', 
    show, 
    onClose 
}: { 
    message: string; 
    type?: ToastType; 
    show: boolean; 
    onClose: () => void;
}) {
    const { showToast } = useToast();
    
    useEffect(() => {
        if (show) {
            showToast(message, type);
            onClose(); 
        }
    }, [show, message, type, showToast, onClose]);

    return null;
}