import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

/**
 * Individual Toast Component
 */
const ToastItem: React.FC<{
  toast: Toast;
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    if (!toast.duration) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border p-4 shadow-lg animate-slideUp',
        config.bgColor,
        config.borderColor,
        isExiting && 'animate-slideDown opacity-0'
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1">
        {toast.title && (
          <h4 className={cn('font-semibold text-sm mb-1', config.textColor)}>
            {toast.title}
          </h4>
        )}
        <p className={cn('text-sm', config.textColor)}>
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={cn(
              'mt-2 text-xs font-medium underline hover:no-underline',
              config.textColor
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleClose}
        className={cn('p-1 hover:bg-white/20 rounded transition-colors', config.textColor)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

/**
 * Toast Container Component
 */
export const ToastContainer: React.FC<{
  toasts: Toast[];
  onClose: (id: string) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ toasts, onClose, position = 'bottom-right' }) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-3 pointer-events-none',
        positionClasses[position]
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

/**
 * Toast Context and Hook
 */
const ToastContext = React.createContext<{
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
} | null>(null);

export const ToastProvider: React.FC<{
  children: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ children, position = 'bottom-right' }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} position={position} />
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return {
    success: (message: string, title?: string, duration?: number) =>
      context.addToast({ type: 'success', message, title, duration }),
    error: (message: string, title?: string, duration?: number) =>
      context.addToast({ type: 'error', message, title, duration }),
    warning: (message: string, title?: string, duration?: number) =>
      context.addToast({ type: 'warning', message, title, duration }),
    info: (message: string, title?: string, duration?: number) =>
      context.addToast({ type: 'info', message, title, duration }),
    custom: (toast: Omit<Toast, 'id'>) => context.addToast(toast),
    remove: context.removeToast,
    clearAll: context.clearAll,
  };
};
