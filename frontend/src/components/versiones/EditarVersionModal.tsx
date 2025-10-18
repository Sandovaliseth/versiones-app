import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Version } from '@/types';
import { TextField } from './FormComponents';
import { cn } from '@/lib/utils';

interface EditarVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: Version | null;
  onSave: (id: string, updatedData: Partial<Version>) => void;
}

export default function EditarVersionModal({
  isOpen,
  onClose,
  version,
  onSave
}: EditarVersionModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    responsable: ''
  });

  useEffect(() => {
    if (version) {
      setFormData({
        nombre: version.nombre || '',
        responsable: version.responsable || ''
      });
    }
  }, [version]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version) return;
    onSave(version.id, {
      nombre: formData.nombre || undefined,
      responsable: formData.responsable || undefined
    });
    onClose();
  };

  if (!version) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Overlay mejorado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
            onClick={onClose}
          />

          {/* Contenedor del modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="w-full max-w-3xl mx-4 flex items-center justify-center overflow-auto py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 12 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                className="relative w-full max-h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  className="relative px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-200/50 dark:border-gray-700/50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(168,85,247,0.08) 100%)'
                  }}
                >
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40">
                        <PencilSquareIcon className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-sans font-semibold text-gray-900 dark:text-white tracking-tight">
                          Editar Versión
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body font-normal mt-0.5">
                          v{version.numeroVersion} • {version.cliente}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.05, rotate: 10 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
                  <div className="space-y-6">
                    {/* Info fija */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-sm font-body font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                        Información Fija
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Versión:</span>
                          <span className="ml-2 font-sans font-bold text-gray-900 dark:text-white">
                            v{version.numeroVersion}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                            {version.cliente}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Build:</span>
                          <span className="ml-2 font-mono font-semibold text-gray-900 dark:text-white">
                            {version.buildYyyymmdd}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                          <span
                            className={cn(
                              'ml-2 px-2 py-0.5 rounded-lg font-semibold text-xs',
                              version.estado === 'Published'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : version.estado === 'Ready'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            )}
                          >
                            {version.estado}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Campos editables */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-sans font-bold text-gray-900 dark:text-white">
                        📝 Campos Editables
                      </h3>

                      <TextField
                        label="Nombre de la Versión"
                        value={formData.nombre}
                        onChange={(value) => handleChange('nombre', value)}
                        placeholder="Ej: Release Primavera 2024"
                        helper="Opcional: Un nombre descriptivo para esta versión"
                      />

                      <TextField
                        label="Responsable"
                        value={formData.responsable}
                        onChange={(value) => handleChange('responsable', value)}
                        placeholder="Nombre del responsable técnico"
                        helper="Opcional: Persona encargada de esta versión"
                      />
                    </div>
                  </div>
                </form>

                {/* Footer */}
                <div className="sticky bottom-0 px-6 sm:px-8 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl font-body font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      className="px-6 py-2.5 rounded-xl font-body font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                    >
                      💾 Guardar Cambios
                    </button>
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

