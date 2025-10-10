import { useState, useCallback, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Key para localStorage
const STORAGE_KEY = 'versiones-app-notifications';
const MAX_NOTIFICATIONS = 50; // Máximo de notificaciones a mantener

// Guardar notificaciones en localStorage
const saveNotifications = (notifications: Notification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Cargar notificaciones del localStorage al iniciar (solo una vez)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir timestamps de string a Date
        const withDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        console.log('📥 Notificaciones cargadas del historial:', withDates.length);
        return withDates;
      }
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
    }
    return [];
  });

  // Persistir en localStorage cuando cambian las notificaciones (excepto la primera carga)
  const [isFirstMount, setIsFirstMount] = useState(true);
  useEffect(() => {
    if (isFirstMount) {
      setIsFirstMount(false);
      return;
    }
    saveNotifications(notifications);
  }, [notifications, isFirstMount]);

  const addNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    id?: string // Permitir ID personalizado para sincronización con toasts
  ) => {
    const newNotification: Notification = {
      id: id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => {
      // PRIMERO: Evitar duplicados por ID exacto
      const existsById = prev.some(n => n.id === newNotification.id);
      if (existsById) {
        console.log('🚫 Notificación con ID duplicado bloqueada:', newNotification.id);
        return prev;
      }

      // SEGUNDO: Evitar contenido idéntico muy reciente (últimos 3 segundos)
      const now = newNotification.timestamp.getTime();
      const hasSimilarRecent = prev.some(n => {
        const timeDiff = now - n.timestamp.getTime();
        const sameContent = n.title === title && n.message === message && n.type === type;
        return timeDiff < 3000 && sameContent;
      });

      if (hasSimilarRecent) {
        console.log('🚫 Notificación con contenido duplicado bloqueada:', title);
        return prev;
      }
      
      console.log('✅ Notificación agregada:', title);
      // Mantener solo las últimas MAX_NOTIFICATIONS
      return [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
    });

    return newNotification.id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearAll,
    markAllAsRead
  };
}
