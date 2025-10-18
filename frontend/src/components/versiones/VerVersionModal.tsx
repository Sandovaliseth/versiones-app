import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Version } from '@/types';
import { cn } from '@/lib/utils';

interface VerVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: Version | null;
}

export default function VerVersionModal({ isOpen, onClose, version }: VerVersionModalProps) {
  if (!version) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/70 z-[9998]"
          />

          {/* Modal container */}
          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.45 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl my-0 max-h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Header */}
                <div
                  className="relative px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-200/50 dark:border-gray-700/50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(168,85,247,0.06) 100%)'
                  }}
                >
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 shadow-md"
                      >
                        <DocumentTextIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white tracking-tight">
                            v{version.numeroVersion}
                          </h2>
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className={cn(
                              'px-3 py-1 rounded-lg font-body font-bold text-xs uppercase tracking-wide shadow-sm',
                              version.estado === 'Published'
                                ? 'bg-emerald-500 text-white'
                                : version.estado === 'Ready'
                                ? 'bg-amber-500 text-white'
                                : version.estado === 'Sealed'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-400 text-white'
                            )}
                          >
                            {version.estado}
                          </motion.span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body font-medium">
                          {version.nombre || 'Vista de solo lectura'} • {version.cliente}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                    >
                      <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
                      <h3 className="text-lg font-sans font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">📋</span>
                        Información General
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/50">
                          <p className="text-xs font-body font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                            Cliente
                          </p>
                          <p className="text-base font-sans font-bold text-gray-900 dark:text-white">
                            {version.cliente}
                          </p>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/50">
                          <p className="text-xs font-body font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                            Build
                          </p>
                          <p className="text-base font-sans font-bold text-gray-900 dark:text-white">
                            {version.buildYyyymmdd}
                          </p>
                        </div>
                      </div>
                    </div>

                    {version.responsable && (
                      <div className="space-y-3">
                        <h4 className="text-lg font-sans font-bold text-gray-900 dark:text-white">
                          Información Adicional
                        </h4>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-body font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                            Responsable
                          </p>
                          <p className="text-sm font-body text-gray-900 dark:text-white">
                            {version.responsable}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-6 w-6 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                        <div>
                          <h4 className="font-sans font-bold text-gray-900 dark:text-white">
                            Estado del Proceso
                          </h4>
                          <p className="text-sm font-body text-gray-600 dark:text-gray-400 mt-1">
                            {version.estado === 'Published'
                              ? '✅ Versión firmada y certificada completamente'
                              : version.estado === 'Ready'
                                ? '⏳ Versión lista para firma, esperando correo'
                                : '📝 Versión en borrador'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 px-6 sm:px-8 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex gap-3 justify-end">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 rounded-xl font-body font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Cerrar
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

