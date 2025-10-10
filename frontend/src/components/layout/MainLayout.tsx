import { useState, useEffect, createContext, useContext } from 'react';
import BentoNavbar from './BentoNavbar';
import { ToastManager } from '../ui/ToastManager';
import { useToastWithHistory } from '@/hooks/useToastWithHistory';
import { useNotifications } from '@/hooks/useNotifications';

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

const MainLayout = ({ children }: MainLayoutProps) => {
  const notificationsState = useNotifications();
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <BentoNavbar 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode}
          notifications={notificationsState.notifications}
          unreadCount={notificationsState.unreadCount}
          onMarkAsRead={notificationsState.markAsRead}
          onClearAll={notificationsState.clearAll}
        />
        
        <ToastManager toasts={toast.toasts} removeToast={toast.removeToast} />
        
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ToastContext.Provider>
  );
};

export default MainLayout;