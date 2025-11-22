import { createContext, useContext } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationsContext = createContext<ReturnType<typeof useNotifications> | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notificationsState = useNotifications();
  return (
    <NotificationsContext.Provider value={notificationsState}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within NotificationsProvider');
  }
  return context;
};
