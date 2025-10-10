import { Version, DashboardStats, VersionEstado } from '@/types';

const STORAGE_KEYS = {
  VERSIONES: 'versiones-app:versiones',
  STATS: 'versiones-app:stats'
};


class StorageService {
  
  saveVersiones(versiones: Version[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VERSIONES, JSON.stringify(versiones));
      console.log('✅ Versiones guardadas en localStorage:', versiones.length);
    } catch (error) {
      console.error('❌ Error guardando versiones:', error);
    }
  }

  
  getVersiones(): Version[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VERSIONES);
      if (data) {
        const versiones = JSON.parse(data);
        console.log('✅ Versiones cargadas desde localStorage:', versiones.length);
        return versiones;
      }
      return null;
    } catch (error) {
      console.error('❌ Error cargando versiones:', error);
      return null;
    }
  }

  
  saveStats(stats: DashboardStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      console.log('✅ Estadísticas guardadas');
    } catch (error) {
      console.error('❌ Error guardando estadísticas:', error);
    }
  }

  
  getStats(): DashboardStats | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      return null;
    }
  }

  
  addVersion(nuevaVersion: Omit<Version, 'id' | 'creadoEn'>): Version {
    const versiones = this.getVersiones() || [];
    
    const version: Version = {
      ...nuevaVersion,
      id: Date.now().toString(),
      creadoEn: new Date().toISOString(),
      estado: nuevaVersion.estado || 'Draft'
    };

    versiones.unshift(version); // Agregar al inicio
    this.saveVersiones(versiones);

    // Actualizar estadísticas
    this.updateStats(versiones);

    return version;
  }

  
  updateVersion(id: string, updates: Partial<Version>): Version | null {
    const versiones = this.getVersiones() || [];
    const index = versiones.findIndex(v => v.id === id);

    if (index === -1) {
      console.error('❌ Versión no encontrada:', id);
      return null;
    }

    versiones[index] = { ...versiones[index], ...updates };
    this.saveVersiones(versiones);

    // Actualizar estadísticas
    this.updateStats(versiones);

    return versiones[index];
  }

  
  deleteVersion(id: string): boolean {
    const versiones = this.getVersiones() || [];
    const newVersiones = versiones.filter(v => v.id !== id);

    if (newVersiones.length === versiones.length) {
      console.error('❌ Versión no encontrada:', id);
      return false;
    }

    this.saveVersiones(newVersiones);
    this.updateStats(newVersiones);

    return true;
  }

  
  private updateStats(versiones: Version[]): void {
    const versionesPorEstado = versiones.reduce((acc, version) => {
      acc[version.estado] = (acc[version.estado] || 0) + 1;
      return acc;
    }, {} as Record<VersionEstado, number>);

    const stats: DashboardStats = {
      versiones: {
        totalVersiones: versiones.length,
        versionesPorEstado,
        versionesRecientes: versiones.slice(0, 5),
        artefactosPorTipo: { bin: 0, pkg: 0, doc: 0 }
      },
      actividad: [],
      trabajosPendientes: versiones.filter(v => v.estado === 'Draft' || v.estado === 'Ready').length
    };

    this.saveStats(stats);
  }

  
  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.VERSIONES);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    console.log('✅ Datos locales limpiados');
  }

  
  hasStoredData(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.VERSIONES);
  }
}

export const storageService = new StorageService();
