import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  PlusIcon
} from '@heroicons/react/24/outline';
import { Badge, Input } from '@/components/ui';
import { Version, VersionEstado, DashboardStats } from '@/types';
import { versionService } from '@/services/versionService';
import CrearVersionModal from '@/components/versiones/CrearVersionModal';
import { CrearVersionData } from '@/components/versiones/types';
import VerVersionModal from '@/components/versiones/VerVersionModal';
import EditarVersionModal from '@/components/versiones/EditarVersionModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { mockVersiones, mockStats, USE_MOCK_DATA } from '@/data/mockData';
import { storageService } from '@/services/storageService';
import { useToastContext } from '@/components/layout/MainLayout';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [versiones, setVersiones] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<VersionEstado | 'TODOS'>('TODOS');
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showVerModal, setShowVerModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<{ id: string; number: string } | null>(null);
  
  const toast = useToastContext();

  useEffect(() => {
    loadDashboardData();
    
    return () => {
      setShowCrearModal(false);
      setShowVerModal(false);
      setShowEditarModal(false);
      setShowConfirmDialog(false);
      setSelectedVersion(null);
      setVersionToDelete(null);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Primero intentar cargar desde localStorage
      const storedVersiones = storageService.getVersiones();
      const storedStats = storageService.getStats();

      if (storedVersiones && storedStats) {
        console.log('✅ Datos cargados desde localStorage');
        setVersiones(storedVersiones);
        setStats(storedStats);
        setLoading(false);
        return;
      }

      if (USE_MOCK_DATA) {
        // Usar datos mock para desarrollo
        console.log('📊 Inicializando con datos mock');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Guardar en localStorage para persistencia
        storageService.saveVersiones(mockVersiones);
        storageService.saveStats(mockStats);
        
        setVersiones(mockVersiones);
        setStats(mockStats);
      } else {
        // Cargar datos reales del backend
        const [versionesResponse] = await Promise.all([
          versionService.getVersions()
        ]);
        
        const versionesData = versionesResponse.content;
        
        // Guardar en localStorage
        storageService.saveVersiones(versionesData);
        
        setVersiones(versionesData);
        
        // Calcular estadísticas desde los datos
        const statsData: DashboardStats = {
          versiones: {
            totalVersiones: versionesData.length,
            versionesPorEstado: versionesData.reduce((acc: Record<VersionEstado, number>, version: Version) => {
              acc[version.estado] = (acc[version.estado] || 0) + 1;
              return acc;
            }, {} as Record<VersionEstado, number>),
            versionesRecientes: versionesData.slice(0, 5),
            artefactosPorTipo: { bin: 0, pkg: 0, doc: 0 }
          },
          actividad: [],
          trabajosPendientes: versionesData.filter(v => 
            v.estado === 'Draft' || v.estado === 'Ready'
          ).length
        };
        
        storageService.saveStats(statsData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      // Fallback a datos mock si hay error
      console.log('🔄 Fallback a datos mock por error de conexión');
      storageService.saveVersiones(mockVersiones);
      storageService.saveStats(mockStats);
      setVersiones(mockVersiones);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
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

  const filteredVersiones = versiones.filter(version => {
    const matchesSearch = version.numeroVersion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         version.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterEstado === 'TODOS' || version.estado === filterEstado;
    return matchesSearch && matchesFilter;
  });

  const confirmDelete = () => {
    if (!versionToDelete) return;
    
    storageService.deleteVersion(versionToDelete.id);
    loadDashboardData();
    toast.error(
      '🗑️ Versión Eliminada',
      `La versión ${versionToDelete.number} ha sido eliminada permanentemente`
    );
    setVersionToDelete(null);
  };

  const handleCrearVersion = async (versionData: CrearVersionData) => {
    try {
      // Crear nueva versión usando el servicio de persistencia
      const nuevaVersion = storageService.addVersion({
        cliente: versionData.cliente || 'Sistema Principal',
        nombre: versionData.nombreVersionCliente || `Versión ${versionData.versionBase}`,
        numeroVersion: versionData.versionBase || '1.0.0',
        buildYyyymmdd: versionData.build || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        estado: 'Draft' as VersionEstado,
        responsable: versionData.responsable || 'Usuario'
      });

      console.log('✅ Versión creada exitosamente:', nuevaVersion);

      // Simular delay de red para UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Recargar los datos desde localStorage
      await loadDashboardData();
      
      // Cerrar modal
      setShowCrearModal(false);
      
      // Mostrar mensaje de éxito con animación
      toast.success(
        '¡Versión creada exitosamente!',
        `La versión ${versionData.versionBase} ha sido creada en estado Draft`
      );
      
    } catch (error) {
      console.error('❌ Error creando versión:', error);
      toast.error(
        'Error al crear versión',
        'Hubo un problema al crear la versión. Inténtalo de nuevo.'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-shimmer w-32 h-32 ultra-rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative space-y-6"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
              Gestor de Versiones
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-body font-normal mt-2">
              Sistema de control y trazabilidad
            </p>
          </motion.div>

          <motion.button
            onClick={() => setShowCrearModal(true)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="btn-primary flex items-center gap-2 px-6 py-3 shadow-md hover:shadow-lg font-body"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="font-semibold">Crear Versión</span>
          </motion.button>
        </div><motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        ><motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 shadow-sm">
                <DocumentTextIcon className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-1">Total Versiones</p>
                <h3 className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                  {stats?.versiones.totalVersiones || 0}
                </h3>
              </div>
            </div>
          </motion.div><motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 shadow-sm">
                <ClockIcon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">En Progreso</p>
                <h3 className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                  {(stats?.versiones.versionesPorEstado?.['Draft'] || 0) + 
                   (stats?.versiones.versionesPorEstado?.['Ready'] || 0)}
                </h3>
              </div>
            </div>
          </motion.div><motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 shadow-sm">
                <CheckCircleIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Publicadas</p>
                <h3 className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                  {stats?.versiones.versionesPorEstado?.['Published'] || 0}
                </h3>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 shadow-sm">
                <CheckCircleIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">Selladas</p>
                <h3 className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                  {stats?.versiones.versionesPorEstado?.['Sealed'] || 0}
                </h3>
              </div>
            </div>
          </motion.div>

        </motion.div><motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
        >
        <div className="p-6"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                Versiones Recientes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-body mt-1">
                Historial de versiones creadas y su estado actual
              </p>
            </div><div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Buscar versión..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
              />
              
              <div className="relative w-full sm:w-auto min-w-[140px]">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as VersionEstado | 'TODOS')}
                className="px-4 py-2.5 pr-10 text-sm sm:text-base w-full font-display font-semibold rounded-xl 
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
          </div><div className="space-y-3">
            {filteredVersiones.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                  No hay versiones disponibles
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Crea tu primera versión para comenzar
                </p>
              </div>
            ) : (
              filteredVersiones.map((version, index) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 backdrop-blur-sm"
                ><div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                      <DocumentTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-semibold text-lg text-gray-900 dark:text-white truncate tracking-tight">
                        v{version.numeroVersion}
                      </h4>
                      {version.nombre && (
                        <p className="text-sm font-body font-normal text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {version.nombre}
                        </p>
                      )}
                    </div>
                  </div><div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                    <Badge 
                      variant={getEstadoBadgeVariant(version.estado)}
                      className="text-xs px-3 py-1 rounded-xl"
                    >
                      {version.estado}
                    </Badge>
                    
                    <span className="text-xs text-gray-400 dark:text-gray-500 hidden lg:inline whitespace-nowrap">
                      {new Date().toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span><div className="flex items-center gap-1 ml-auto">
                      <motion.button
                        onClick={() => {
                          setSelectedVersion(version);
                          setShowVerModal(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                        title="Ver detalles"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => {
                          setSelectedVersion(version);
                          setShowEditarModal(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                        title="Editar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => {
                          setVersionToDelete({ id: version.id, number: version.numeroVersion });
                          setShowConfirmDialog(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                        title="Eliminar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
        </motion.div><CrearVersionModal
          isOpen={showCrearModal}
          onClose={() => setShowCrearModal(false)}
          onSubmit={handleCrearVersion}
        /><VerVersionModal
          isOpen={showVerModal}
          onClose={() => {
            setShowVerModal(false);
            setSelectedVersion(null);
          }}
          version={selectedVersion}
        /><EditarVersionModal
          isOpen={showEditarModal}
          onClose={() => {
            setShowEditarModal(false);
            setSelectedVersion(null);
          }}
          version={selectedVersion}
          onSave={(id, updatedData) => {
            storageService.updateVersion(id, updatedData);
            loadDashboardData();
            toast.success(
              'Versión actualizada',
              'Los cambios se guardaron exitosamente'
            );
          }}
        />

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
      </div>
    </div>
  );
};

export default Dashboard;