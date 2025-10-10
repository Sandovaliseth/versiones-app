import { motion } from 'framer-motion';
import { useToastContext } from '@/components/layout/MainLayout';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

/**
 * Componente de demostración del sistema de notificaciones sincronizadas.
 * 
 * Muestra cómo usar los toasts que se archivan automáticamente en el historial.
 * Los toasts desaparecen después de 5 segundos y se guardan en NotificationPanel.
 */
export function NotificationDemo() {
  const toast = useToastContext();

  const demos = [
    {
      type: 'success' as const,
      icon: CheckCircleIcon,
      title: 'Operación exitosa',
      message: 'Los datos se guardaron correctamente en la base de datos',
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      action: () => toast.success(
        '✓ Operación exitosa',
        'Los datos se guardaron correctamente en la base de datos'
      )
    },
    {
      type: 'error' as const,
      icon: XCircleIcon,
      title: 'Error crítico',
      message: 'No se pudo conectar con el servidor. Por favor, intente más tarde',
      color: 'from-red-500 to-rose-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => toast.error(
        '✗ Error crítico',
        'No se pudo conectar con el servidor. Por favor, intente más tarde'
      )
    },
    {
      type: 'warning' as const,
      icon: ExclamationTriangleIcon,
      title: 'Advertencia importante',
      message: 'Esta acción no se puede deshacer. Asegúrese de tener un respaldo',
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      action: () => toast.warning(
        '⚠️ Advertencia importante',
        'Esta acción no se puede deshacer. Asegúrese de tener un respaldo',
        7000 // Dura más tiempo
      )
    },
    {
      type: 'info' as const,
      icon: InformationCircleIcon,
      title: 'Nueva actualización',
      message: 'Hay una nueva versión del sistema disponible para descargar',
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => toast.info(
        'ℹ️ Nueva actualización',
        'Hay una nueva versión del sistema disponible para descargar'
      )
    }
  ];

  const handleSequence = () => {
    toast.info('Iniciando secuencia', 'Se mostrarán 4 notificaciones...', 2000);
    
    setTimeout(() => {
      toast.success('Paso 1 completado', 'Validación exitosa');
    }, 2500);

    setTimeout(() => {
      toast.info('Procesando paso 2', 'Esto puede tardar unos segundos');
    }, 4000);

    setTimeout(() => {
      toast.warning('Advertencia en paso 3', 'Se encontraron elementos duplicados');
    }, 6000);

    setTimeout(() => {
      toast.success('¡Secuencia completada!', 'Todas las notificaciones se archivaron');
    }, 8000);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-display font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Sistema de Notificaciones Sincronizadas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-body text-lg">
          Los toasts temporales se archivan automáticamente en el historial persistente
        </p>
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800"
      >
        <div className="flex gap-3">
          <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-display font-bold text-blue-900 dark:text-blue-100">
              ¿Cómo funciona?
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200 font-body">
              <li>• Haz clic en cualquier botón para mostrar un toast temporal</li>
              <li>• El toast desaparece automáticamente después de 5 segundos (o ciérralo con X)</li>
              <li>• Cuando se cierra, se guarda automáticamente en el historial</li>
              <li>• Abre el panel de notificaciones (🔔 en la esquina superior) para verlas</li>
              <li>• Las notificaciones se guardan en localStorage y persisten entre sesiones</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Demo Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demos.map((demo, index) => {
          const Icon = demo.icon;
          return (
            <motion.button
              key={demo.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={demo.action}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`${demo.bgColor} dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all text-left group`}
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${demo.color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-display font-bold ${demo.textColor} dark:text-white mb-1`}>
                    {demo.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-body line-clamp-2">
                    {demo.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-body mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click para mostrar →
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Sequence Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800"
      >
        <div className="text-center space-y-4">
          <h3 className="font-display font-bold text-purple-900 dark:text-purple-100">
            🎭 Demo de Secuencia
          </h3>
          <p className="text-sm text-purple-800 dark:text-purple-200 font-body">
            Muestra una serie de notificaciones en orden para demostrar la sincronización automática
          </p>
          <motion.button
            onClick={handleSequence}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-body font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Iniciar Secuencia de 4 Notificaciones
          </motion.button>
        </div>
      </motion.div>

      {/* Technical Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-300 dark:border-gray-700"
      >
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-3">
          🔧 Información Técnica
        </h3>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 font-mono">
          <div className="flex justify-between">
            <span>Hook usado:</span>
            <span className="text-pink-600 dark:text-pink-400">useToastContext()</span>
          </div>
          <div className="flex justify-between">
            <span>Sistema interno:</span>
            <span className="text-purple-600 dark:text-purple-400">useToastWithHistory()</span>
          </div>
          <div className="flex justify-between">
            <span>Persistencia:</span>
            <span className="text-blue-600 dark:text-blue-400">localStorage</span>
          </div>
          <div className="flex justify-between">
            <span>Límite de historial:</span>
            <span className="text-emerald-600 dark:text-emerald-400">50 notificaciones</span>
          </div>
          <div className="flex justify-between">
            <span>Duración por defecto:</span>
            <span className="text-amber-600 dark:text-amber-400">5000ms (5s)</span>
          </div>
        </div>
      </motion.div>

      {/* Code Example */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-900 dark:bg-gray-950 rounded-2xl p-6 border-2 border-gray-700"
      >
        <h3 className="font-display font-bold text-white mb-3">
          💻 Ejemplo de Código
        </h3>
        <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`// 1. Obtener el contexto
const toast = useToastContext();

// 2. Usar en tu código
const handleAction = async () => {
  try {
    await doSomething();
    
    // Toast aparece Y se archiva automáticamente
    toast.success(
      'Operación exitosa',
      'Los datos se guardaron correctamente'
    );
  } catch (error) {
    toast.error('Error', error.message);
  }
};`}
        </pre>
      </motion.div>
    </div>
  );
}
