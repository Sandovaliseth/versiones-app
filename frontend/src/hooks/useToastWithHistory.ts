import { useCallback } from 'react';
import { useToast, Toast } from '@/components/ui/ToastManager';
import { useNotifications } from './useNotifications';

/**
 * Hook combinado que sincroniza toasts temporales con el historial persistente.
 * 
 * Las notificaciones se archivan INMEDIATAMENTE cuando se crean,
 * no cuando el toast desaparece, para que aparezcan en tiempo real en NotificationPanel.
 */
export function useToastWithHistory() {
  const { addNotification } = useNotifications();

  // Callback que se ejecuta cuando un toast se cierra (mantener para compatibilidad)
  const handleToastArchive = useCallback((_toast: Toast) => {
    // Ya no necesitamos archivar aquí porque se hace inmediatamente
  }, []);

  // Crear instancia de useToast con el callback de archivo
  const toastMethods = useToast(handleToastArchive);

  return {
    ...toastMethods,
    // Métodos mejorados que archivan INMEDIATAMENTE
    success: (title: string, message: string, duration?: number) => {
      const toastId = toastMethods.success(title, message, duration);
      // Archivar inmediatamente en notificaciones
      addNotification('success', title, message, toastId);
      return toastId;
    },
    error: (title: string, message: string, duration?: number) => {
      const toastId = toastMethods.error(title, message, duration);
      // Archivar inmediatamente en notificaciones
      addNotification('error', title, message, toastId);
      return toastId;
    },
    warning: (title: string, message: string, duration?: number) => {
      const toastId = toastMethods.warning(title, message, duration);
      // Archivar inmediatamente en notificaciones
      addNotification('warning', title, message, toastId);
      return toastId;
    },
    info: (title: string, message: string, duration?: number) => {
      const toastId = toastMethods.info(title, message, duration);
      // Archivar inmediatamente en notificaciones
      addNotification('info', title, message, toastId);
      return toastId;
    }
  };
}
