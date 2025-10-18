import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onRemove: (id: string) => void;
}

const Toast = ({ id, type, title, message, duration = 5000, onRemove }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const getIcon = (iconClass: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={`h-6 w-6 ${iconClass}`} />;
      case 'error':
        return <XCircleIcon className={`h-6 w-6 ${iconClass}`} />;
      default:
        return <CheckCircleIcon className={`h-6 w-6 ${iconClass}`} />;
    }
  };

  const getGlassColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
          border: 'border-emerald-200/50 dark:border-emerald-500/30',
          glow: 'shadow-emerald-500/20 dark:shadow-emerald-400/20',
          icon: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'error':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-400/10',
          border: 'border-rose-200/50 dark:border-rose-500/30',
          glow: 'shadow-rose-500/20 dark:shadow-rose-400/20',
          icon: 'text-rose-600 dark:text-rose-400'
        };
      default:
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-400/10',
          border: 'border-blue-200/50 dark:border-blue-500/30',
          glow: 'shadow-blue-500/20 dark:shadow-blue-400/20',
          icon: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  const colors = getGlassColors();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        relative overflow-hidden
        flex items-start p-4 rounded-2xl
        ${colors.bg} ${colors.border} ${colors.glow}
        backdrop-blur-xl backdrop-saturate-150
        border shadow-2xl
        before:absolute before:inset-0
        before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none
      `}
      style={{
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {getIcon(colors.icon)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-body">
          {title}
        </p>
        {message && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-body">
            {message}
          </p>
        )}
      </div>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(id)}
        className="ml-4 flex-shrink-0 rounded-lg p-1.5 hover:bg-white/30 dark:hover:bg-black/20 transition-all duration-200 backdrop-blur-sm"
      >
        <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      </motion.button>
    </motion.div>
  );
};

// Hook para manejar toasts con límite de 2 en cola
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const MAX_TOASTS = 2; // Máximo 2 toasts en pantalla

  const addToast = (toast: Omit<ToastProps, 'id' | 'onRemove'>) => {
    const id = Date.now().toString();
    setToasts(prev => {
      const newToasts = [...prev, { ...toast, id, onRemove: removeToast }];
      // Si hay más de MAX_TOASTS, eliminar los más antiguos
      if (newToasts.length > MAX_TOASTS) {
        return newToasts.slice(-MAX_TOASTS);
      }
      return newToasts;
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full sm:w-auto px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );

  return { addToast, ToastContainer };
};

export default Toast;
