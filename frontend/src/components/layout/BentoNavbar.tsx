import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { NotificationPanel } from '@/components/ui/NotificationPanel';

interface BentoNavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  notifications: any[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

interface ModuleCard {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  description: string;
  badge?: string;
}

const modules: ModuleCard[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: HomeIcon,
    href: '/',
    color: 'from-blue-500 to-cyan-500',
    description: 'Panel principal con resumen general del sistema'
  },
  {
    id: 'versions',
    title: 'Versiones',
    icon: DocumentTextIcon,
    href: '/versions',
    color: 'from-pink-500 to-purple-500',
    description: 'Gestión completa de versiones y releases',
    badge: 'Activo'
  },
  {
    id: 'analytics',
    title: 'Analíticas',
    icon: ChartBarIcon,
    href: '/analytics',
    color: 'from-emerald-500 to-teal-500',
    description: 'Métricas, estadísticas y reportes detallados'
  }
];

const BentoNavbar = ({
  darkMode,
  toggleDarkMode,
  notifications,
  unreadCount,
  onMarkAsRead,
  onClearAll
}: BentoNavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  // Las notificaciones se sincronizan autom├íticamente desde los toasts usando useToastWithHistory

  useEffect(() => {
    // Cerrar panel de notificaciones cuando se abre el menú de módulos o cuando cambia de ruta
    if (isOpen || location.pathname) {
      setIsNotificationsOpen(false);
    }
  }, [isOpen, location.pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="sticky top-0 z-50 backdrop-blur-xl border-b shadow-md"
        style={{
          background: darkMode
            ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.90) 50%, rgba(55, 65, 81, 0.85) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.90) 50%, rgba(243, 244, 246, 0.85) 100%)',
          borderImage: darkMode
            ? 'linear-gradient(90deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3)) 1'
            : 'linear-gradient(90deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2)) 1'
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center gap-3 cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                <DocumentTextIcon className="w-5 h-5 text-white relative z-10" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-2xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              </motion.div>
              <div>
                <h1 className="text-lg font-display font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Versiones App
                </h1>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 font-body leading-tight">
                  Sistema Inteligente
                </p>
              </div>
            </motion.div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="hidden sm:flex relative p-2.5 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 hover:border-pink-400 dark:hover:border-pink-500 transition-all duration-300 hover:shadow-lg group"
              >
                <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" />
                {unreadCount > 0 && (
                  <>
                    <motion.span
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                      className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                    />
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold shadow-lg">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-14 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 dark:from-indigo-500 dark:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                onClick={toggleDarkMode}
              >
                <motion.div
                  className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-gray-900 shadow-md flex items-center justify-center"
                  animate={{
                    x: darkMode ? 22 : 0
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30
                  }}
                >
                  <AnimatePresence mode="wait">
                    {darkMode ? (
                      <motion.div
                        key="moon"
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        exit={{ rotate: 180, scale: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <MoonIcon className="h-3.5 w-3.5 text-indigo-600" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="sun"
                        initial={{ rotate: 180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        exit={{ rotate: -180, scale: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SunIcon className="h-3.5 w-3.5 text-amber-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 hover:border-pink-400 dark:hover:border-pink-500 transition-all duration-300 hover:shadow-lg"
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                    >
                      <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <div className="fixed top-20 left-4 right-4 sm:left-5 sm:right-5 z-[101] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl p-0 max-h-[calc(100vh-88px)] overflow-y-auto origin-top animate-[menuOpen_0.25s_ease-out]">
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Módulos del Sistema
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Selecciona el módulo que deseas utilizar
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => {
                  const isActive = location.pathname === module.href;
                  const Icon = module.icon;

                  return (
                    <Link
                      key={module.id}
                      to={module.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'block p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative group',
                        'bg-white dark:bg-gray-800',
                        'hover:shadow-lg hover:scale-[1.02]',
                        isActive
                          ? 'border-pink-500 dark:border-pink-400 shadow-lg shadow-pink-500/20 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-900/20 dark:to-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-500'
                      )}
                    >
                      {module.badge && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold shadow-md">
                          {module.badge}
                        </span>
                      )}

                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div
                          className={cn(
                            'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform',
                            module.color
                          )}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </div>

                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {module.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {module.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={onMarkAsRead}
        onClearAll={onClearAll}
      />
    </>
  );
};

export default BentoNavbar;
