"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
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
        setTimeout(() => onRemove(toast.id), 300); // Wait for exit animation
    }, [toast.id, onRemove]);

    const startTimer = useCallback(() => {
        startTimeRef.current = Date.now();
        
        // Resume progress bar animation
        if (progressRef.current) {
            progressRef.current.style.animationPlayState = 'running';
        }

        timerRef.current = setTimeout(() => {
            handleClose();
        }, remainingTimeRef.current);
    }, [handleClose]);

    const pauseTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        // Calculate remaining time
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);

        // Pause progress bar animation
        if (progressRef.current) {
            progressRef.current.style.animationPlayState = 'paused';
        }
        setIsPaused(true);
    }, []);

    useEffect(() => {
        startTimer();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []); // Only on mount

    const config = {
        success: { 
            icon: <CheckCircle className="w-6 h-6 text-emerald-500" />, 
            bg: 'bg-emerald-50 dark:bg-emerald-950/40', 
            border: 'border-emerald-200 dark:border-emerald-800',
            bar: 'bg-emerald-500'
        },
        error: { 
            icon: <XCircle className="w-6 h-6 text-rose-500" />, 
            bg: 'bg-rose-50 dark:bg-rose-950/40', 
            border: 'border-rose-200 dark:border-rose-800',
            bar: 'bg-rose-500'
        },
        warning: { 
            icon: <AlertTriangle className="w-6 h-6 text-amber-500" />, 
            bg: 'bg-amber-50 dark:bg-amber-950/40', 
            border: 'border-amber-200 dark:border-amber-800',
            bar: 'bg-amber-500'
        },
        info: { 
            icon: <Info className="w-6 h-6 text-blue-500" />, 
            bg: 'bg-blue-50 dark:bg-blue-950/40', 
            border: 'border-blue-200 dark:border-blue-800',
            bar: 'bg-blue-500'
        }
    };

    const style = config[toast.type];

    return (
        <div
            className={`
                relative w-full max-w-sm md:max-w-md mx-auto mb-3 rounded-2xl overflow-hidden shadow-xl border backdrop-blur-xl transition-all
                ${style.bg} ${style.border}
                ${isExiting ? 'toast-exit' : 'toast-enter'}
            `}
            onMouseEnter={() => { pauseTimer(); setIsPaused(true); }}
            onMouseLeave={() => { setIsPaused(false); startTimer(); }}
            role="alert"
        >
            <div className="flex items-center gap-4 p-4">
                <div className="shrink-0 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                    {style.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-white leading-5">
                        {toast.message}
                    </p>
                </div>

                <button 
                    onClick={handleClose}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700/50">
                <div
                    ref={progressRef}
                    className={`h-full absolute left-0 rounded-r-full ${style.bar}`}
                    style={{
                        animationName: 'progress-shrink',
                        animationDuration: `${toast.duration}ms`,
                        animationTimingFunction: 'linear',
                        animationFillMode: 'forwards'
                    }}
                />
            </div>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            <style>{toastStyles}</style>
            {children}
            <div className="fixed top-0 left-0 right-0 z-[9999] p-4 flex flex-col items-center pointer-events-none">
                <div className="w-full pointer-events-auto">
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
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Legacy Wrapper for backward compatibility
export const ToastLegacy: React.FC<{ message: string; type?: ToastType; show: boolean; onClose: () => void; duration?: number }> = ({ message, type = 'success', show, onClose, duration }) => {
    const { showToast } = useToast();
    const shownRef = useRef(false);
    
    useEffect(() => {
        if (show && !shownRef.current) {
            shownRef.current = true;
            showToast(message, type, duration);
            onClose(); 
        } else if (!show) {
            shownRef.current = false;
        }
    }, [show, message, type, duration, showToast, onClose]);

    return null;
};
