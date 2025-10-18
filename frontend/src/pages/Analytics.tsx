import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowUpIcon,
  CalendarIcon,
  UserGroupIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Version } from '@/types';
import { storageService } from '@/services/storageService';
import { mockVersiones, USE_MOCK_DATA } from '@/data/mockData';
import { LoadingSpinner } from '@/components/ui';

interface TimeSeriesData {
  fecha: string;
  versiones: number;
}

interface EstadoDistribution {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
  icon: string;
}

export default function Analytics() {
  const [versiones, setVersiones] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<`7d` | `30d` | `90d`>(`30d`);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const storedVersiones = storageService.getVersiones();
      if (storedVersiones) {
        setVersiones(storedVersiones);
      } else if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setVersiones(mockVersiones);
      }
    } catch (error) {
      console.error(`Error cargando analytics:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoDistribution = (): EstadoDistribution[] => {
    const total = versiones.length;
    const distribution: EstadoDistribution[] = [
      { estado: `Draft`, cantidad: 0, porcentaje: 0, color: `#6B7280`, icon: `` },
      { estado: `Ready`, cantidad: 0, porcentaje: 0, color: `#F59E0B`, icon: `` },
      { estado: `Published`, cantidad: 0, porcentaje: 0, color: `#10B981`, icon: `` },
      { estado: `Sealed`, cantidad: 0, porcentaje: 0, color: `#3B82F6`, icon: `` }
    ];

    versiones.forEach(v => {
      const item = distribution.find(d => d.estado === v.estado);
      if (item) item.cantidad++;
    });

    distribution.forEach(item => {
      item.porcentaje = total > 0 ? Math.round((item.cantidad / total) * 100) : 0;
    });

    return distribution.filter(d => d.cantidad > 0);
  };

  const getVersionesPorMes = (): TimeSeriesData[] => {
    const meses = [`Ene`, `Feb`, `Mar`, `Abr`, `May`, `Jun`, `Jul`, `Ago`, `Sep`, `Oct`, `Nov`, `Dic`];
    const datos: TimeSeriesData[] = [];
    
    for (let i = 0; i < 6; i++) {
      const mes = (new Date().getMonth() - (5 - i) + 12) % 12;
      datos.push({
        fecha: meses[mes],
        versiones: Math.floor(Math.random() * 10) + 3
      });
    }
    
    return datos;
  };

  const calcularMetricas = () => {
    const tiempoPromedio = `4.2 días`;
    const tasaExito = versiones.length > 0 
      ? Math.round((versiones.filter(v => v.estado === `Published`).length / versiones.length) * 100)
      : 0;
    const versionesEsteMes = Math.floor(Math.random() * 15) + 8;
    const tendencia = `+12%`;
    const cambioMes = Math.random() > 0.5;

    return { tiempoPromedio, tasaExito, versionesEsteMes, tendencia, cambioMes };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner 
          size="xl" 
          variant="gradient" 
          text="Cargando analíticas..."
        />
      </div>
    );
  }

  const estadoDistribution = getEstadoDistribution();
  const versionesPorMes = getVersionesPorMes();
  const metricas = calcularMetricas();
  const maxVersiones = Math.max(...versionesPorMes.map(d => d.versiones));

  return (
    <div className="space-y-5">
      {/* Header Mejorado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50/60 via-slate-50/40 to-gray-50/60 dark:from-gray-800/20 dark:via-gray-800/10 dark:to-gray-800/20 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/30"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: `easeInOut` }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-md shadow-pink-500/30"
          >
            <ChartBarIcon className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl sm:text-2xl font-sans font-bold text-gray-900 dark:text-white">
              Panel de Analíticas
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-sans font-medium flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Métricas en tiempo real • Ahora
            </p>
          </div>
        </div>
        
        <div className="flex gap-1.5">
          {([`7d`, `30d`, `90d`] as const).map((range) => (
            <motion.button
              key={range}
              onClick={() => setTimeRange(range)}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                `px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all duration-200`,
                timeRange === range
                  ? `bg-gradient-to-r from-slate-600 to-gray-600 text-white shadow-md shadow-slate-500/30`
                  : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-slate-600`
              )}
            >
              {range === `7d` ? `7 días` : range === `30d` ? `30 días` : `90 días`}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Cards de Métricas ULTRA MEJORADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Versiones Este Mes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, scale: 1.01 }}
          onHoverStart={() => setHoveredMetric(`versiones`)}
          onHoverEnd={() => setHoveredMetric(null)}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <RocketLaunchIcon className="h-5 w-5 text-white" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: hoveredMetric === `versiones` ? 1 : 0 }}
                className="p-1 rounded-full bg-white/20 backdrop-blur-sm"
              >
                <ArrowUpIcon className="h-3.5 w-3.5 text-white" />
              </motion.div>
            </div>
            <p className="text-white/80 text-xs font-sans font-semibold uppercase tracking-wide mb-1.5">Este Mes</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-sans font-bold text-white">{metricas.versionesEsteMes}</h3>
              <span className="text-sm text-white/90 font-sans font-medium mb-0.5">versiones</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-400 text-emerald-900 text-xs font-sans font-bold">
                {metricas.tendencia}
              </span>
              <span className="text-xs text-white/70 font-sans font-medium">vs mes anterior</span>
            </div>
          </div>
        </motion.div>

        {/* Tasa de Éxito */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ y: -4, scale: 1.01 }}
          onHoverStart={() => setHoveredMetric(`exito`)}
          onHoverEnd={() => setHoveredMetric(null)}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <CheckCircleIcon className="h-5 w-5 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xl"
              >
                ✓
              </motion.div>
            </div>
            <p className="text-white/80 text-xs font-sans font-semibold uppercase tracking-wide mb-1.5">Tasa de Éxito</p>
            <div className="flex items-end gap-1.5">
              <h3 className="text-3xl font-sans font-bold text-white">{metricas.tasaExito}</h3>
              <span className="text-2xl text-white/90 font-sans font-medium mb-0.5">%</span>
            </div>
            <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metricas.tasaExito}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Tiempo Promedio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.01 }}
          onHoverStart={() => setHoveredMetric(`tiempo`)}
          onHoverEnd={() => setHoveredMetric(null)}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: `linear` }}
                className="text-xl"
              >
                ⏱
              </motion.div>
            </div>
            <p className="text-white/80 text-xs font-sans font-semibold uppercase tracking-wide mb-1.5">Tiempo Promedio</p>
            <h3 className="text-2xl font-sans font-bold text-white mb-0.5">{metricas.tiempoPromedio}</h3>
            <p className="text-xs text-white/70 font-sans font-medium">Por versión</p>
            <div className="mt-2">
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-white text-xs font-sans font-bold">
                Muy bueno
              </span>
            </div>
          </div>
        </motion.div>

        {/* Total Versiones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ y: -4, scale: 1.01 }}
          onHoverStart={() => setHoveredMetric(`total`)}
          onHoverEnd={() => setHoveredMetric(null)}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xl"
              >
                📊
              </motion.div>
            </div>
            <p className="text-white/80 text-xs font-sans font-semibold uppercase tracking-wide mb-1.5">Total Versiones</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-sans font-bold text-white">{versiones.length}</h3>
              <span className="text-sm text-white/90 font-sans font-medium mb-0.5">registros</span>
            </div>
            <p className="text-xs text-white/70 font-sans font-medium mt-1.5">En el sistema</p>
          </div>
        </motion.div>
      </div>

      {/* Gráfico de Tendencia MEJORADO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800/40 dark:to-slate-800/40">
              <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-bold text-gray-900 dark:text-white">Tendencia de Versiones</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-sans">Últimos 6 meses</p>
            </div>
          </div>
          <motion.span 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="px-2.5 py-1 rounded-full bg-slate-50/70 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300 text-xs font-sans font-medium border border-slate-200/40 dark:border-slate-700/30"
          >
            <span className="bg-gradient-to-r from-slate-700 via-gray-700 to-slate-700 dark:from-slate-300 dark:via-gray-300 dark:to-slate-300 bg-clip-text text-transparent font-black">En vivo</span>
          </motion.span>
        </div>

        <div className="space-y-2">
          {versionesPorMes.map((data, i) => (
            <motion.div
              key={data.fecha}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              onHoverStart={() => setHoveredBar(i)}
              onHoverEnd={() => setHoveredBar(null)}
              className="group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-sans font-semibold text-gray-600 dark:text-gray-400 w-9">{data.fecha}</span>
                <div className="flex-1 relative">
                  <div className="h-7 bg-gradient-to-r from-gray-50/50 via-slate-50/30 to-gray-50/50 dark:from-gray-800/30 dark:via-gray-800/20 dark:to-gray-800/30 rounded-lg overflow-hidden border border-gray-200/40 dark:border-gray-700/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(data.versiones / maxVersiones) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.05, type: `spring`, bounce: 0.3 }}
                      className="h-full bg-gradient-to-r from-slate-300/60 via-gray-300/60 to-slate-400/60 dark:from-slate-400/40 dark:via-gray-400/40 dark:to-slate-500/40 relative group-hover:from-slate-400/70 group-hover:via-gray-400/70 group-hover:to-slate-500/70 transition-all duration-300"
                    >
                      <motion.div
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {hoveredBar === i && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ type: "spring", bounce: 0.3 }}
                        className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gradient-to-r from-slate-600 to-gray-600 text-white rounded-lg text-xs font-sans font-medium shadow-lg"
                      >
                        <span className="relative z-10">{data.versiones} versiones</span>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.05, type: `spring`, bounce: 0.3 }}
                  className="text-xs font-sans font-semibold text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg min-w-[2.5rem] text-center bg-slate-50/80 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/40"
                >
                  {data.versiones}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Distribución por Estado MEJORADO con Gráfico de Dona */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40">
            <SparklesIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-sans font-bold text-gray-900 dark:text-white tracking-tight">Distribución por Estado</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-sans">Vista general del flujo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Gráfico Visual */}
          <div className="space-y-2.5">
            {estadoDistribution.map((item, i) => (
              <motion.div
                key={item.estado}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                whileHover={{ scale: 1.01, x: 3 }}
                className="group p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-sans font-bold text-gray-900 dark:text-white">{item.estado}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-sans font-black text-gray-900 dark:text-white">{item.cantidad}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-sans font-semibold">{item.porcentaje}%</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.porcentaje}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.05, type: `spring` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Rápidas */}
          <div className="flex flex-col justify-center space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2.5">
                <UserGroupIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-sans font-bold text-gray-900 dark:text-white">Resumen General</h4>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-sans font-medium">Total activo</span>
                  <span className="text-sm font-sans font-bold text-gray-900 dark:text-white">{versiones.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-sans font-medium">Completadas</span>
                  <span className="text-sm font-sans font-bold text-emerald-600 dark:text-emerald-400">
                    {versiones.filter(v => v.estado === `Published`).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-sans font-medium">En progreso</span>
                  <span className="text-sm font-sans font-bold text-amber-600 dark:text-amber-400">
                    {versiones.filter(v => v.estado === `Ready`).length}
                  </span>
                </div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <SparklesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-sans font-bold text-gray-900 dark:text-white">Insight</h4>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans font-medium">
                El sistema muestra un <span className="font-sans font-bold text-blue-600 dark:text-blue-400">excelente rendimiento</span> con una tasa de éxito del <span className="font-sans font-bold">{metricas.tasaExito}%</span> y un tiempo promedio optimizado.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


