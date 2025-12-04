import { useState, useEffect, createContext, useContext } from 'react';
import BentoNavbar from './BentoNavbar';
import { ToastManager } from '../ui/ToastManager';
import { useToastWithHistory } from '@/hooks/useToastWithHistory';
import { NotificationsProvider, useNotificationsContext } from '@/context/NotificationsContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

type ToastContextType = ReturnType<typeof useToastWithHistory>;

const ToastContext = createContext<ToastContextType | null>(null);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within MainLayout');
  }
  return context;
};

const MainLayoutContent = ({ children }: MainLayoutProps) => {
  const notificationsState = useNotificationsContext();
  const toast = useToastWithHistory();
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return true;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <ToastContext.Provider value={toast}>
      <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <BentoNavbar 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode}
          notifications={notificationsState.notifications}
          unreadCount={notificationsState.unreadCount}
          onMarkAsRead={notificationsState.markAsRead}
          onClearAll={notificationsState.clearAll}
        />
        
        <ToastManager toasts={toast.toasts} removeToast={toast.removeToast} />
        {/* Main content con scroll controlado */}
        <main className="h-[calc(100vh-64px)] overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ToastContext.Provider>
  );
};

const MainLayout = ({ children }: MainLayoutProps) => (
  <NotificationsProvider>
    <MainLayoutContent>{children}</MainLayoutContent>
  </NotificationsProvider>
);

export default MainLayout;