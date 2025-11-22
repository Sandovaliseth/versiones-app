import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastManagerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'from-emerald-500 to-teal-500',
    borderColor: 'border-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400'
  },
  error: {
    icon: XCircleIcon,
    bgColor: 'from-red-500 to-rose-500',
    borderColor: 'border-red-400',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400'
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-400',
    iconColor: 'text-blue-600 dark:text-blue-400'
  }
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="relative w-full max-w-sm backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      style={{
        boxShadow: '0 10px 40px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.bgColor}`} />
      
      <div className="p-4 flex gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${config.bgColor} flex items-center justify-center shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-display font-bold text-gray-900 dark:text-white">
            {toast.title}
          </h3>
          <p className="mt-1 text-sm font-body text-gray-600 dark:text-gray-300 line-clamp-2">
            {toast.message}
          </p>
        </div>

        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastManager({ toasts, removeToast }: ToastManagerProps) {
  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 max-w-full pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToast(onToastArchive?: (toast: Toast) => void) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    // Encontrar el toast antes de eliminarlo para archivarlo
    const toastToArchive = toasts.find(t => t.id === id);
    
    setToasts((prev) => prev.filter((t) => t.id !== id));

    // Archivar el toast si existe el callback
    if (toastToArchive && onToastArchive) {
      onToastArchive(toastToArchive);
    }
  };

  const success = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'success', title, message, duration });
  };

  const error = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'error', title, message, duration });
  };

  const warning = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'warning', title, message, duration });
  };

  const info = (title: string, message: string, duration?: number) => {
    return addToast({ type: 'info', title, message, duration });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}
