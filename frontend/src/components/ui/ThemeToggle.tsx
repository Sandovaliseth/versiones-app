import { motion } from 'framer-motion';
import { useAdaptiveTheme, getThemeEmoji, getThemeLabel } from '@/hooks/useAdaptiveTheme';

/**
 * Componente ThemeToggle - Toggle moderno para cambiar entre modos claro/oscuro
 * 
 * CaracterÃ­sticas UX/UI 2025:
 * - Animaciones suaves con Framer Motion
 * - Microinteracciones inteligentes
 * - Feedback visual inmediato
 * - DiseÃ±o glassmorphism
 * - Transiciones elÃ¡sticas
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useAdaptiveTheme();
  
  const emoji = getThemeEmoji(theme, resolvedTheme);
  const label = getThemeLabel(theme);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-6 right-6 z-50"
    >
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="theme-toggle group relative"
        title={label}
        aria-label={label}
      ><motion.div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: resolvedTheme === 'dark' 
              ? 'radial-gradient(circle, rgba(233, 30, 99, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
            filter: 'blur(8px)'
          }}
        /><motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none"
        >
          {label}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-white rotate-45"></div>
        </motion.div>
      </motion.button><motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap"
      >
        {emoji}
      </motion.div>
    </motion.div>
  );
}


export function ThemePanel() {
  const { theme, setTheme } = useAdaptiveTheme();
  
  const themes: Array<{ value: 'light' | 'dark' | 'auto'; label: string; icon: string; description: string }> = [
    {
      value: 'light',
      label: 'Modo Claro',
      icon: '☀️',
      description: 'Interfaz luminosa para ambientes bien iluminados'
    },
    {
      value: 'dark',
      label: 'Modo Oscuro',
      icon: '🌙',
      description: 'Reduce fatiga visual en ambientes oscuros'
    },
    {
      value: 'auto',
      label: 'Modo Adaptativo',
      icon: '🌗',
      description: 'Cambia automáticamente según la hora del día (18:00-06:00)'
    }
  ];
  
  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="title-subsection text-lg mb-4">Apariencia</h3>
      
      <div className="space-y-3">
        {themes.map((themeOption) => (
          <motion.button
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left
              ${theme === themeOption.value
                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30'
                : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-primary-300 dark:hover:border-primary-700'
              }
            `}
          >
            <div className="flex items-start gap-4">
              <motion.div
                animate={theme === themeOption.value ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
                className="text-3xl"
              >
                {themeOption.icon}
              </motion.div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-sans font-semibold text-gray-900 dark:text-white">
                    {themeOption.label}
                  </h4>
                  {theme === themeOption.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {themeOption.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div><motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h5 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
              Modo Oscuro Recomendado
            </h5>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              El modo oscuro está optimizado como estándar en diseño UX/UI 2025, 
              reduciendo la fatiga visual y mejorando la concentración en entornos 
              de trabajo prolongados.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

