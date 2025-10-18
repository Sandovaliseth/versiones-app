import { useState } from 'react';
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

  // Las notificaciones se sincronizan automáticamente desde los toasts usando useToastWithHistory

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
            <Link to="/">
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
                <h1 className="text-lg font-sans font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Versiones App
                </h1>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 font-body leading-tight">
                  Sistema Inteligente
                </p>
              </div>
            </motion.div>
            </Link>

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[80%] max-w-2xl rounded-3xl bg-gradient-to-br from-gray-50/95 to-white/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-6 overflow-hidden"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-sans font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Módulos del Sistema
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-sans mt-1">
                  Navega por los módulos principales
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {modules.map((module, index) => {
                  const isActive = location.pathname === module.href;
                  const Icon = module.icon;

                  return (
                    <div key={module.id}>
                      <Link
                        to={module.href}
                        onClick={() => setIsOpen(false)}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'relative p-6 rounded-2xl border-2 transition-all duration-200 group cursor-pointer',
                            'bg-white dark:bg-gray-800',
                            'h-[200px] flex flex-col items-center justify-center gap-3',
                            isActive
                              ? 'border-pink-500 dark:border-pink-400 shadow-2xl shadow-pink-500/30 bg-gradient-to-br from-pink-100/80 to-purple-100/80 dark:from-pink-900/30 dark:to-purple-900/30 ring-2 ring-pink-500/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/20 hover:bg-gradient-to-br hover:from-pink-50/50 hover:to-purple-50/50 dark:hover:from-pink-900/10 dark:hover:to-purple-900/10'
                          )}
                        >
                          {/* Gradiente animado en hover */}
                          <motion.div
                            className={cn(
                              'absolute inset-0 bg-gradient-to-br rounded-2xl',
                              module.color
                            )}
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 0.15 }}
                            transition={{
                              duration: 0.15,
                              ease: 'easeOut'
                            }}
                            animate={{
                              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                            }}
                            style={{
                              backgroundSize: '200% 200%'
                            }}
                          />

                          {/* Partículas flotantes en hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
                                style={{
                                  left: `${15 + (i % 4) * 25}%`,
                                  top: `${20 + Math.floor(i / 4) * 60}%`
                                }}
                                animate={{
                                  y: [-15, 15, -15],
                                  x: [Math.sin(i) * 10, -Math.sin(i) * 10, Math.sin(i) * 10],
                                  opacity: [0, 1, 0],
                                  scale: [0.5, 1.2, 0.5]
                                }}
                                transition={{
                                  duration: 2 + i * 0.3,
                                  repeat: Infinity,
                                  delay: i * 0.2
                                }}
                              />
                            ))}
                          </div>

                          {/* Brillo diagonal en hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                            animate={{
                              x: ['-100%', '100%'],
                              y: ['-100%', '100%']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                            style={{
                              transform: 'rotate(-45deg)',
                              width: '150%',
                              height: '150%'
                            }}
                          />

                          {/* Línea de escaneo */}
                          <motion.div
                            className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-0 group-hover:opacity-50"
                            animate={{
                              y: ['0%', '100%']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                          />

                          {isActive && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 via-purple-400/20 to-indigo-400/20 rounded-2xl animate-pulse" />
                              <div
                                className="absolute inset-0 rounded-2xl"
                                style={{
                                  background: 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.15), transparent 70%)'
                                }}
                              />
                            </>
                          )}

                          <div className="relative z-10 flex flex-col items-center justify-center gap-2.5 w-full h-full">
                            {/* Badge */}
                            {module.badge && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-0 right-0 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold shadow-lg"
                              >
                                {module.badge}
                              </motion.span>
                            )}

                            {/* Ãcono */}
                            <motion.div
                              whileHover={{ 
                                scale: 1.1,
                                rotate: 5
                              }}
                              transition={{ 
                                type: 'spring',
                                stiffness: 400,
                                damping: 20
                              }}
                              className={cn(
                                'relative w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0',
                                module.color
                              )}
                            >
                              <Icon className="w-8 h-8 text-white relative z-10" />
                              {/* Sombra del Ã­cono */}
                              <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl blur-sm -z-10" />
                            </motion.div>
                            
                            {/* Título */}
                            <h3 className="text-base font-sans font-bold text-center text-gray-900 dark:text-white leading-tight px-2">
                              {module.title}
                            </h3>
                            
                            {/* Descripción */}
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-body text-center leading-snug px-2 line-clamp-2">
                              {module.description}
                            </p>
                          </div>
                        </motion.div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </motion.div>
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

