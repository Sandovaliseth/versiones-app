import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DocumentTextIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { CrearVersionData, initialFormData } from './types';
import { useVersionValidation } from './useVersionValidation';
import { FormSection, TextField, TextAreaField, FileField, PathField } from './FormComponents';

interface CrearVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearVersionData) => void;
}

export default function CrearVersionModal({ isOpen, onClose, onSubmit }: CrearVersionModalProps) {
  const [formData, setFormData] = useState<CrearVersionData>(initialFormData);
  const { errors, validateForm, clearErrors } = useVersionValidation();
  const [showMetadata, setShowMetadata] = useState(false);
  
  const fieldRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const focusNextField = (currentField: string) => {
    const fieldOrder = [
      'cliente',
      'nombreVersionCliente',
      'terminal',
      'versionBase',
      'versionAumento',
      'build'
    ];
    
    const currentIndex = fieldOrder.indexOf(currentField);
    if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
      const nextField = fieldOrder[currentIndex + 1];
      const nextInput = fieldRefs.current[nextField];
      if (nextInput) {
        setTimeout(() => nextInput.focus(), 50);
      }
    }
  };

  const handleInputChange = (field: keyof CrearVersionData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Cuando cambia a personalizada, limpiar el CID si era 0
      if (field === 'tipoFirma' && value === 'personalizada' && prev.cid === '0') {
        newData.cid = '';
      }
      // Cuando cambia a genérica, establecer CID en 0
      else if (field === 'tipoFirma' && value === 'generica') {
        newData.cid = '0';
      }
      
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm(formData)) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    clearErrors();
    setShowMetadata(false);
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-gray-900/95 via-purple-900/80 to-pink-900/80 backdrop-blur-sm z-[100]"
            transition={{ duration: 0.2 }}
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center pt-20 pb-4 px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: 'spring',
                stiffness: 400,
                damping: 30,
                mass: 0.8
              }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
                <motion.div 
                  className="relative px-6 sm:px-8 py-5 sm:py-6 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                        className="flex-shrink-0"
                      >
                        <DocumentTextIcon className="h-9 w-9 sm:h-10 sm:w-10 text-pink-600 dark:text-pink-400" />
                      </motion.div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 dark:text-white">
                          Crear Nueva Versión
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-1">
                          Firma o Certificación de versión
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      onClick={handleClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </motion.button>
                  </div>
                </motion.div>

                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                  <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 sm:py-6 space-y-4">                    
                    <div className="space-y-3">
                      <label className="block font-body text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Tipo de Documento <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.button
                          type="button"
                          onClick={() => handleInputChange('tipoDocumento', 'firma')}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'relative p-5 rounded-2xl border-2 transition-all font-body font-semibold overflow-hidden group',
                            formData.tipoDocumento === 'firma'
                              ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/20 text-pink-700 dark:text-pink-300 shadow-lg shadow-pink-500/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 bg-white dark:bg-gray-800'
                          )}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: formData.tipoDocumento === 'firma' ? ['-100%', '100%'] : '-100%'
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: formData.tipoDocumento === 'firma' ? Infinity : 0,
                              ease: 'linear'
                            }}
                          />
                          <div className="relative flex items-center justify-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-base">FIRMA</span>
                          </div>
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={() => handleInputChange('tipoDocumento', 'certificacion')}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'relative p-5 rounded-2xl border-2 transition-all font-body font-semibold overflow-hidden group',
                            formData.tipoDocumento === 'certificacion'
                              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-700 dark:text-purple-300 shadow-lg shadow-purple-500/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                          )}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: formData.tipoDocumento === 'certificacion' ? ['-100%', '100%'] : '-100%'
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: formData.tipoDocumento === 'certificacion' ? Infinity : 0,
                              ease: 'linear'
                            }}
                          />
                          <div className="relative flex items-center justify-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-base">CERTIFICACIÓN</span>
                          </div>
                        </motion.button>
                      </div>
                    </div>
                    <FormSection
                      title="Información del Cliente y Versión"
                      description="Estos campos son comunes para FIRMA y CERTIFICACIÓN"
                      borderColor="border-pink-200 dark:border-pink-800"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <TextField
                          label="Cliente"
                          value={formData.cliente || ''}
                          onChange={(val) => handleInputChange('cliente', val)}
                          onEnter={() => focusNextField('cliente')}
                          inputRef={(el) => fieldRefs.current.cliente = el}
                          error={errors.cliente}
                          required
                          placeholder="Ej: Banco XYZ"
                        />

                        <TextField
                          label="Nombre Versión Cliente (ENLACEAV)"
                          value={formData.nombreVersionCliente || ''}
                          onChange={(val) => handleInputChange('nombreVersionCliente', val)}
                          onEnter={() => focusNextField('nombreVersionCliente')}
                          inputRef={(el) => fieldRefs.current.nombreVersionCliente = el}
                          error={errors.nombreVersionCliente}
                          required
                          placeholder="Ej: ENLACEAV_V2.5"
                        />

                        <TextField
                          label="Terminal"
                          value={formData.terminal || ''}
                          onChange={(val) => handleInputChange('terminal', val)}
                          onEnter={() => focusNextField('terminal')}
                          inputRef={(el) => fieldRefs.current.terminal = el}
                          error={errors.terminal}
                          required
                          placeholder="Ej: VX820"
                        />

                        <TextField
                          label="Versión Base"
                          value={formData.versionBase || ''}
                          onChange={(val) => handleInputChange('versionBase', val)}
                          onEnter={() => focusNextField('versionBase')}
                          inputRef={(el) => fieldRefs.current.versionBase = el}
                          error={errors.versionBase}
                          required
                          placeholder="Ej: 1.0.0"
                          helper="Formato: X.Y.Z"
                        />

                        <TextField
                          label="Versión Aumento"
                          value={formData.versionAumento || ''}
                          onChange={(val) => handleInputChange('versionAumento', val)}
                          onEnter={() => focusNextField('versionAumento')}
                          inputRef={(el) => fieldRefs.current.versionAumento = el}
                          error={errors.versionAumento}
                          required
                          placeholder="Ej: 1.1.0"
                          helper="Formato: X.Y.Z"
                        />

                        <TextField
                          label="Build"
                          value={formData.build || ''}
                          onChange={(val) => handleInputChange('build', val)}
                          onEnter={() => focusNextField('build')}
                          inputRef={(el) => fieldRefs.current.build = el}
                          error={errors.build}
                          required
                          placeholder="Ej: 250108"
                          helper="Formato: AAMMDD (6 dígitos)"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-5">
                        {/* Tipo de Firma */}
                        <div className="flex flex-col">
                          <label className="block font-display text-sm font-bold text-gray-800 dark:text-white mb-2">
                            🔐 Tipo de Firma
                          </label>
                          <div className="relative group flex-1 mt-1">
                            <select
                              value={formData.tipoFirma || 'generica'}
                              onChange={(e) => handleInputChange('tipoFirma', e.target.value as 'generica' | 'personalizada')}
                              className="w-full h-50 px-5 py-3 pr-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 
                                        backdrop-blur-xl bg-white/90 dark:bg-gray-800/90
                                        hover:bg-gradient-to-br hover:from-pink-50/90 hover:via-purple-50/80 hover:to-white/90 
                                        dark:hover:from-pink-950/30 dark:hover:via-purple-950/20 dark:hover:to-gray-800/90
                                        text-gray-900 dark:text-white font-display font-semibold 
                                        hover:border-pink-400 dark:hover:border-pink-500
                                        focus:border-pink-500 dark:focus:border-pink-400 
                                        focus:ring-4 focus:ring-pink-500/20 
                                        transition-all duration-300 appearance-none cursor-pointer 
                                        shadow-md hover:shadow-xl hover:shadow-pink-500/20 dark:hover:shadow-pink-500/10
                                        hover:scale-[1.01] focus:scale-[1.01]
                                        focus:shadow-2xl focus:shadow-pink-500/30 dark:focus:shadow-pink-500/20"
                            >
                              <option value="generica">Genérica</option>
                              <option value="personalizada">Personalizada</option>
                            </select>
                            
                            {/* Animated Chevron */}
                            <motion.div
                              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                              whileHover={{ 
                                rotate: 180,
                                scale: 1.15
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <ChevronDownIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                            </motion.div>
                          </div>
                        </div>

                        {/* CID (Customer ID) */}
                        <div className="flex flex-col">
                          <label className="block font-display text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                              ID
                            </span>
                            CID (Customer ID)
                          </label>
                          
                          <div className="relative flex-1 flex items-center">
                            {formData.tipoFirma === 'generica' ? (
                              <div className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 font-display text-gray-600 dark:text-gray-300 font-bold text-lg">
                                0
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={formData.cid || ''}
                                onChange={(e) => handleInputChange('cid', e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 
                                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-display font-bold 
                                          focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 
                                          transition-all hover:border-indigo-400 dark:hover:border-indigo-500"
                              />
                            )}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400 font-bold text-lg">
                              #
                            </div>
                          </div>
                        </div>
                      </div>

                      <TextAreaField
                        label="Descripción Breve"
                        value={formData.descripcionBreve || ''}
                        onChange={(val) => handleInputChange('descripcionBreve', val)}
                        error={errors.descripcionBreve}
                        required
                        placeholder="Describe brevemente los cambios de esta versión..."
                        rows={3}
                      />

                      <PathField
                        label="📁 Ruta de Compilación"
                        value={formData.rutaCompilacion || ''}
                        onChange={(val) => handleInputChange('rutaCompilacion', val)}
                        error={errors.rutaCompilacion}
                        required
                        placeholder="Ej: C:\builds\proyecto\v1.0.0 o haz click en el icono de carpeta"
                        helper="Haz click en el icono de carpeta para explorar y seleccionar la ruta"
                      />
                    </FormSection>
                    {formData.tipoDocumento === 'certificacion' && (
                      <FormSection
                        title="Campos Exclusivos de Certificación"
                        description="Estos campos solo aplican para el proceso de CERTIFICACIÓN"
                        borderColor="border-purple-200 dark:border-purple-800"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                          <TextField
                            label="Nombre del .pkg"
                            value={formData.nombrePkg || ''}
                            onChange={(val) => handleInputChange('nombrePkg', val)}
                            error={errors.nombrePkg}
                            required
                            placeholder="Ej: app_v1.0.0.pkg"
                          />

                          <TextField
                            label="Checksum del .pkg"
                            value={formData.checksumPkg || ''}
                            onChange={(val) => handleInputChange('checksumPkg', val)}
                            error={errors.checksumPkg}
                            required
                            placeholder="Ej: a3b5c7d9..."
                          />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                          <div className="space-y-2">
                            <TextAreaField
                              label="Links de OneDrive"
                              value={formData.linksOneDrive || ''}
                              onChange={(val) => handleInputChange('linksOneDrive', val)}
                              error={errors.linksOneDrive}
                              required
                              placeholder="Pega los links de OneDrive aquí..."
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <PathField
                              label="Ruta Local de Escritorio"
                              value={formData.rutaLocal || ''}
                              onChange={(path) => handleInputChange('rutaLocal', path)}
                              placeholder="C:\Users\Desktop\MiCarpeta"
                              helper="Selecciona la carpeta del escritorio con el botón 📁"
                            />
                          </div>
                        </div>

                        <FileField
                          label="Captura de Evidencia"
                          onChange={(file) => handleInputChange('capturaEvidencia', file)}
                          accept="image/*,.pdf"
                          helper="Imagen o PDF de evidencia"
                        />
                      </FormSection>
                    )}

                    <motion.div 
                      className="pt-4 border-t border-gray-200 dark:border-gray-700"
                      initial={false}
                    >
                      <motion.button
                        type="button"
                        onClick={() => setShowMetadata(!showMetadata)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <span className="font-body font-semibold text-gray-700 dark:text-gray-300">
                          Metadatos Opcionales
                        </span>
                        <motion.svg
                          animate={{ rotate: showMetadata ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="h-5 w-5 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </motion.button>

                      <AnimatePresence>
                        {showMetadata && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextField
                                  label="Responsable"
                                  value={formData.responsable || ''}
                                  onChange={(val) => handleInputChange('responsable', val)}
                                  placeholder="Nombre del responsable"
                                />
                              </div>

                              <TextAreaField
                                label="Notas Técnicas"
                                value={formData.notasTecnicas || ''}
                                onChange={(val) => handleInputChange('notasTecnicas', val)}
                                placeholder="Notas adicionales para el equipo técnico..."
                                rows={3}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                  </form>
                </div>
                <div className="sticky bottom-0 px-6 sm:px-8 py-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <div className="flex gap-3 justify-end">
                    <motion.button
                      type="button"
                      onClick={handleClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 rounded-xl font-body font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="submit"
                      onClick={handleSubmit}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 rounded-xl font-body font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Crear Versión
                    </motion.button>
                  </div>
                </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}