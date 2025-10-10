import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar'
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Enhanced Backdrop with stronger blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200]"
            transition={{ duration: 0.2 }}
          />

          {/* Responsive Dialog - Centered properly */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 50 }}
              transition={{ 
                type: 'spring',
                stiffness: 400,
                damping: 25,
                mass: 0.6
              }}
              className="w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient background */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-red-400/20 to-pink-500/20 rounded-full blur-3xl"></div>

              {/* Close button - Mobile friendly */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all z-10"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </motion.button>

              {/* Header con icono - Responsive */}
              <div className="relative bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 px-4 sm:px-6 py-5 border-b-2 border-amber-200 dark:border-gray-700">
                <div className="flex items-center gap-3 sm:gap-4 pr-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: 1, 
                      rotate: 0,
                    }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1
                    }}
                    whileHover={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    className="flex-shrink-0 p-2.5 sm:p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl sm:rounded-2xl shadow-lg"
                  >
                    <ExclamationTriangleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-lg sm:text-xl font-display font-black text-gray-900 dark:text-white"
                  >
                    {title}
                  </motion.h3>
                </div>
              </div>

              {/* Contenido - Responsive padding */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative px-4 sm:px-6 py-5 sm:py-6"
              >
                <p className="text-sm sm:text-base font-body text-gray-700 dark:text-gray-300 leading-relaxed">
                  {message}
                </p>
              </motion.div>

              {/* Botones - Responsive layout */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="relative px-4 sm:px-6 py-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-t-2 border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end"
              >
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-display font-bold text-gray-700 dark:text-gray-300 
                            backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 
                            border-2 border-gray-300 dark:border-gray-600 
                            hover:bg-gray-100 dark:hover:bg-gray-700 
                            hover:border-gray-400 dark:hover:border-gray-500
                            transition-all shadow-md hover:shadow-lg"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleConfirm}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -2,
                    boxShadow: '0 20px 40px rgba(239, 68, 68, 0.4)'
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-display font-black 
                            bg-gradient-to-r from-red-600 via-pink-600 to-red-600 
                            hover:from-red-700 hover:via-pink-700 hover:to-red-700
                            text-white transition-all 
                            shadow-lg shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/60
                            relative overflow-hidden group"
                >
                  {/* Animated shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.6 }}
                  ></motion.div>
                  <span className="relative z-10">{confirmText}</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
