import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentDuplicateIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Input, LoadingSpinner } from '@/components/ui';
import { Version, VersionEstado } from '@/types';
import { storageService } from '@/services/storageService';
import { mockVersiones, USE_MOCK_DATA } from '@/data/mockData';
import { useToast } from '@/components/ui/Toast';
import { useToastContext } from '@/components/layout/MainLayout';
import CrearVersionModal from '@/components/versiones/CrearVersionModal';
import { CrearVersionData } from '@/components/versiones/types';
import { crearCorreoHtml } from '@/components/versiones/helpers';
import VerVersionModal from '@/components/versiones/VerVersionModal';
import EditarVersionModal from '@/components/versiones/EditarVersionModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const Versions = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<VersionEstado | 'TODOS'>('TODOS');
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showVerModal, setShowVerModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<{ id: string; number: string } | null>(null);
  
  const { ToastContainer } = useToast();
  const toastGlobal = useToastContext();

  useEffect(() => {
    loadVersions();
    
    return () => {
      setShowCrearModal(false);
      setShowVerModal(false);
      setShowEditarModal(false);
      setShowConfirmDialog(false);
      setSelectedVersion(null);
      setVersionToDelete(null);
    };
  }, []);

  // Escuchar eventos emitidos por el flujo de creación/monitorización (ej. respuestas aprobadas)
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload = (ev as CustomEvent).detail as any;
        if (!payload?.subject) return;
        const inbox = storageService.getVersiones() || [];
        const matched = inbox.find(v => v.outlookSubject && v.outlookSubject === payload.subject);
        if (matched) {
          // Abrir visibilidad de la versión y marcar como 'Ready' para el siguiente paso
          setSelectedVersion(matched);
          // Abrimos la ficha y el editor para continuar con la certificación
          setShowVerModal(true);
          setShowEditarModal(true);
          storageService.updateVersion(matched.id, { estado: 'Ready' });
          // Avanzar automáticamente hacia certificación / entrega (último paso)
          // Marcamos como Published para reflejar la entrega final del binario firmado.
          setTimeout(() => {
            storageService.updateVersion(matched.id, { estado: 'Published' });
            loadVersions();
            toastGlobal.success('Certificación automática', `${matched.numeroVersion} ha sido certificado y entregado automáticamente.`);
          }, 900);
          loadVersions();
          toastGlobal.success('Respuesta aprobada', `Se detectó respuesta para ${matched.numeroVersion} — abriendo certificación`);
        } else {
          // No hay mapeo directo en localStorage — avisar al usuario
          toastGlobal.info('Respuesta detectada', `Se detectó un correo aprobado con asunto: ${payload.subject}`);
        }
      } catch (e) {
        console.warn('Error processing version:approved event', e);
      }
    };

    window.addEventListener('version:approved', handler as any);
    return () => window.removeEventListener('version:approved', handler as any);
  }, [toastGlobal]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      
      // Cargar desde localStorage
      const storedVersiones = storageService.getVersiones();
      
      if (storedVersiones && storedVersiones.length > 0) {
        console.log('✅ Versiones cargadas desde localStorage');
        setVersions(storedVersiones);
      } else if (USE_MOCK_DATA) {
        // Inicializar con datos mock si no hay nada guardado
        console.log('📊 Inicializando con datos mock');
        setVersions(mockVersiones);
      } else {
        setVersions([]);
      }
    } catch (error) {
      console.error('Error cargando versiones:', error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const runAutomationAfterCreate = async (formData: CrearVersionData, numeroVersion: string) => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      return;
    }

    const rutaCompilacion = formData.rutaCompilacion?.trim();
    if (!rutaCompilacion) {
      toastGlobal.warning(
        'Ruta requerida para automatizar',
        'Se creó la versión, pero no podemos preparar el correo sin la ruta de compilación'
      );
      return;
    }

    const electronAPI = window.electronAPI;
    const findBinaryPath = async (fileName?: string) => {
      if (!fileName) return null;
      try {
        const search = await electronAPI.findFiles(rutaCompilacion, [fileName]);
        if (search?.ok && Array.isArray(search.matches) && search.matches.length > 0) {
          const ordered = [...search.matches].sort((a, b) => a.length - b.length);
          return ordered[0];
        }
      } catch (error) {
        console.error('Error buscando archivo', error);
      }
      return null;
    };

    try {
      toastGlobal.info('Preparando adjuntos', `Buscando artefactos en ${rutaCompilacion}`);

      const filesToZip: string[] = [];
      const baseBinaryName = formData.archivoBinBase || formData.nombreArchivoBin;
      const baseBinary = await findBinaryPath(baseBinaryName);
      if (baseBinary) {
        filesToZip.push(baseBinary);
      } else if (baseBinaryName) {
        toastGlobal.warning('Bin principal no encontrado', `No se halló ${baseBinaryName} en la ruta seleccionada`);
      }

      const aumentoBinary = formData.incluirVersionAumento
        ? await findBinaryPath(formData.archivoBinAumento)
        : null;
      if (aumentoBinary) {
        filesToZip.push(aumentoBinary);
      } else if (formData.incluirVersionAumento && formData.archivoBinAumento) {
        toastGlobal.warning('Bin de aumento no encontrado', `Revisa el nombre ${formData.archivoBinAumento}`);
      }

      if (!filesToZip.length) {
        toastGlobal.warning('Sin archivos adjuntos', 'No fue posible ubicar los binarios especificados para adjuntar automáticamente');
        return;
      }

      const [md5Base, md5Aumento] = await Promise.all([
        baseBinary ? electronAPI.computeMd5(baseBinary) : Promise.resolve(''),
        aumentoBinary ? electronAPI.computeMd5(aumentoBinary) : Promise.resolve('')
      ]);

      const safeClient = (formData.nombreVersionCliente || formData.cliente || 'version').replace(/[^a-zA-Z0-9-_]/g, '_');
      const safeBuild = (formData.build || Date.now().toString().slice(-6)).replace(/[^a-zA-Z0-9-_]/g, '_');
      const safeName = `${safeClient}_${safeBuild}`;
      const zipResult = await electronAPI.zipArtifacts({
        files: filesToZip,
        zipName: `${safeName}.zip`,
        subfolder: formData.cliente || 'version'
      });

      if (!zipResult?.ok || !zipResult.path) {
        throw new Error(zipResult?.error || 'No se pudo crear el archivo ZIP con los binarios');
      }

      const emailPayload: CrearVersionData = { ...formData };
      if (!emailPayload.checksumBase && md5Base) emailPayload.checksumBase = md5Base;
      if (!emailPayload.checksumAumento && md5Aumento) emailPayload.checksumAumento = md5Aumento;

      const { subject, body } = crearCorreoHtml(
        emailPayload,
        emailPayload.checksumAumento || md5Aumento,
        emailPayload.linksOneDrive || null
      );

      const draftResult = await electronAPI.createOutlookDraft({
        subject,
        body,
        attachments: [zipResult.path],
        saveToSent: false,
        send: false
      });

      if (!draftResult?.ok) {
        throw new Error(draftResult?.error || 'Outlook no respondió al crear el borrador');
      }

      toastGlobal.success(
        'Borrador generado en Outlook',
        `Adjuntamos automáticamente ${filesToZip.length} archivo(s) para la versión ${numeroVersion}`
      );
    } catch (error) {
      console.error('Automatización al crear versión falló:', error);
      toastGlobal.error(
        'Automatización incompleta',
        error instanceof Error ? error.message : 'Error inesperado al preparar el email'
      );
    }
  };

  const handleCrearVersion = async (versionData: CrearVersionData) => {
    try {
      // Construir el número de versión desde los campos del formulario
      const numeroVersion = `${versionData.versionBase}.${versionData.versionAumento}.${versionData.build}`;
      const nombreVersion = versionData.nombreVersionCliente || `Versión ${numeroVersion}`;
      
      // Crear nueva versión
      const nuevaVersion = storageService.addVersion({
        cliente: versionData.cliente || 'Sistema Principal',
        nombre: nombreVersion,
        numeroVersion: numeroVersion,
        buildYyyymmdd: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        outlookSubject: (versionData as any).outlookSubject || undefined,
        estado: 'Draft' as VersionEstado,
        responsable: versionData.responsable || 'Usuario'
      });

      console.log('✅ Versión creada exitosamente:', nuevaVersion);

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Recargar versiones
      await loadVersions();
      
      // Cerrar modal
      setShowCrearModal(false);

      // Agregar notificación global en el navbar
      toastGlobal.success(
        'Versión creada exitosamente',
        `La versión ${numeroVersion} ha sido creada y está lista para trabajar`
      );

      await runAutomationAfterCreate(versionData, numeroVersion);
      
    } catch (error) {
      console.error('❌ Error creando versión:', error);
      toastGlobal.error(
        'Error al crear versión',
        'No se pudo crear la versión. Por favor, intenta nuevamente'
      );
    }
  };

  const handleDeleteVersion = (versionId: string, versionNumber: string) => {
    setVersionToDelete({ id: versionId, number: versionNumber });
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (!versionToDelete) return;
    
    const success = storageService.deleteVersion(versionToDelete.id);
    if (success) {
      loadVersions();
      
      // Solo usar notificación global con tipo error (color rojo/warning)
      toastGlobal.error(
        'Version Eliminada',
        `La version ${versionToDelete.number} ha sido eliminada permanentemente del sistema`
      );
    } else {
      toastGlobal.error(
        'Error al Eliminar',
        `No se pudo eliminar la version ${versionToDelete.number}`
      );
    }
    setVersionToDelete(null);
  };

  const getEstadoBadgeVariant = (estado: VersionEstado) => {
    const variants = {
      'Draft': 'secondary' as const,
      'Ready': 'warning' as const,
      'Published': 'success' as const,
      'Sealed': 'default' as const
    };
    return variants[estado] || 'default';
  };

  const filteredVersions = versions.filter(version => {
    const matchesSearch = version.numeroVersion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         version.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         version.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterEstado === 'TODOS' || version.estado === filterEstado;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner 
          size="xl" 
          variant="gradient" 
          text="Cargando versiones..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8"><div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <motion.h1 
          className="text-5xl sm:text-6xl font-sans font-extrabold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          VERSIONES
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={() => setShowCrearModal(true)}
            className="btn-primary flex items-center space-x-2 shadow-md hover:shadow-lg font-body"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Nueva Versión</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </motion.div>
      </div><Card variant="glass" className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Buscar versión, nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full font-body"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 relative group">
            <FunnelIcon className="h-5 w-5 text-gray-400 group-hover:text-pink-500 transition-colors flex-shrink-0 hidden sm:block" />
            
            <div className="relative w-full sm:w-auto min-w-[140px]">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as VersionEstado | 'TODOS')}
                className="px-4 py-2.5 pr-10 text-sm sm:text-base w-full font-sans font-semibold rounded-xl 
                          border-2 border-gray-200 dark:border-gray-700 
                          backdrop-blur-xl bg-white/80 dark:bg-gray-800/80
                          hover:bg-gradient-to-br hover:from-pink-50/90 hover:via-purple-50/80 hover:to-white/90 
                          dark:hover:from-pink-950/30 dark:hover:via-purple-950/20 dark:hover:to-gray-800/90
                          text-gray-900 dark:text-white 
                          hover:border-pink-400 dark:hover:border-pink-500
                          focus:border-pink-500 dark:focus:border-pink-400 
                          focus:ring-4 focus:ring-pink-500/20 
                          transition-all duration-300 cursor-pointer 
                          shadow-md hover:shadow-xl hover:shadow-pink-500/20 dark:hover:shadow-pink-500/10
                          hover:scale-[1.02] focus:scale-[1.02]
                          focus:shadow-2xl focus:shadow-pink-500/30 dark:focus:shadow-pink-500/20
                          appearance-none"
              >
                <option value="TODOS">🌐 Todos</option>
                <option value="Draft">📝 Borrador</option>
                <option value="Ready">⏳ Listo</option>
                <option value="Published">✅ Certificado</option>
              </select>
              
              {/* Animated Chevron */}
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                whileHover={{ rotate: 180, scale: 1.2 }}
                transition={{ duration: 0.3 }}
              >
                <svg 
                  className="h-5 w-5 text-pink-600 dark:text-pink-400 transition-colors" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-20 dark:group-hover:opacity-10 transition-opacity duration-300 -z-10 blur-xl"></div>
            </div>
          </div>
        </div>
      </Card><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredVersions.map((version, index) => (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="glass" className="p-4 sm:p-6 hover-lift relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative"><div className="flex items-start sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex-shrink-0 shadow-sm">
                      <DocumentDuplicateIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-sans font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                        v{version.numeroVersion}
                      </h3>
                      <p className="text-xs sm:text-sm font-body font-normal text-gray-500 dark:text-gray-400 truncate">
                        {version.buildYyyymmdd}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getEstadoBadgeVariant(version.estado)} className="flex-shrink-0 text-xs font-body">
                    {version.estado}
                  </Badge>
                </div><div className="space-y-2 sm:space-y-3 mb-4">
                  <div>
                    <h4 className="font-body font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-2">
                      {version.nombre}
                    </h4>
                    <p className="text-xs sm:text-sm font-body font-normal text-gray-600 dark:text-gray-400 truncate">
                      {version.cliente}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm font-body font-normal text-gray-500 dark:text-gray-400">
                    <span className="truncate">{version.responsable}</span>
                    <span className="text-xs whitespace-nowrap">{new Date(version.creadoEn).toLocaleDateString('es-ES')}</span>
                  </div>
                </div><div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2 flex-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedVersion(version);
                        setShowVerModal(true);
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-xs sm:text-sm px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors font-body font-semibold"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>VER</span>
                    </motion.button>
                    {version.estado === 'Draft' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedVersion(version);
                          setShowEditarModal(true);
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-xs sm:text-sm px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors font-body font-semibold"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>EDITAR</span>
                      </motion.button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {version.estado === 'Draft' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          // Actualizar estado a Ready (firmada)
                          const updatedVersions = versions.map(v => 
                            v.id === version.id ? { ...v, estado: 'Ready' as VersionEstado } : v
                          );
                          setVersions(updatedVersions);
                          storageService.saveVersiones(updatedVersions);
                          
                          // Solo una notificación global (remover addToast duplicado)
                          toastGlobal.success(
                            'Versión firmada digitalmente',
                            `La versión ${version.numeroVersion} ha sido firmada y certificada exitosamente`
                          );
                        }}
                        className="flex-1 sm:flex-initial text-xs sm:text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 transition-colors font-body font-semibold"
                      >
                        FIRMA
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteVersion(version.id, version.numeroVersion)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors flex-shrink-0"
                      title="Eliminar"
                    >
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredVersions.length === 0 && (
        <div className="text-center py-12">
          <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-sans font-semibold text-gray-900 dark:text-gray-100">
            No hay versiones
          </h3>
          <p className="mt-1 text-sm font-body text-gray-500 dark:text-gray-400">
            {searchTerm || filterEstado !== 'TODOS' 
              ? 'No se encontraron versiones con los filtros aplicados.'
              : 'Comienza creando tu primera versión.'
            }
          </p>
        </div>
      )}<CrearVersionModal
        isOpen={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        onSubmit={handleCrearVersion}
      />{selectedVersion && (
        <VerVersionModal
          isOpen={showVerModal}
          onClose={() => {
            setShowVerModal(false);
            setSelectedVersion(null);
          }}
          version={selectedVersion}
        />
      )}{selectedVersion && (
        <EditarVersionModal
          isOpen={showEditarModal}
          onClose={() => {
            setShowEditarModal(false);
            setSelectedVersion(null);
          }}
          version={selectedVersion}
          onSave={(id, updatedData) => {
            const updatedVersions = versions.map(v => 
              v.id === id ? { ...v, ...updatedData } : v
            );
            setVersions(updatedVersions);
            storageService.saveVersiones(updatedVersions);
            setShowEditarModal(false);
            setSelectedVersion(null);
            loadVersions();
            
            // Notificación global de edición
            toastGlobal.info(
              'Versión actualizada',
              `La versión ${selectedVersion?.numeroVersion} ha sido modificada y guardada correctamente`
            );
          }}
        />
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setVersionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message={`¿Seguro que deseas eliminar la versión ${versionToDelete?.number}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <ToastContainer />
    </div>
  );
};

export default Versions;
