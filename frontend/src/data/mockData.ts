// Datos mock para desarrollo mientras se soluciona el backend
import { Version, VersionEstado, DashboardStats } from '@/types';

export const mockVersiones: Version[] = [
  {
    id: '1',
    cliente: 'Sistema Principal',
    nombre: 'Release Navideño 2025',
    numeroVersion: '2.5.0',
    buildYyyymmdd: '20241207',
    estado: 'Published' as VersionEstado,
    responsable: 'Equipo Dev',
    creadoEn: '2024-12-07T10:00:00Z'
  },
  {
    id: '2',
    cliente: 'Sistema Principal',
    nombre: 'Hotfix Crítico',
    numeroVersion: '2.4.1',
    buildYyyymmdd: '20241205',
    estado: 'Ready' as VersionEstado,
    responsable: 'Equipo Dev',
    creadoEn: '2024-12-05T15:30:00Z'
  },
  {
    id: '3',
    cliente: 'Sistema Principal',
    nombre: 'Funcionalidades Q4',
    numeroVersion: '2.4.0',
    buildYyyymmdd: '20241201',
    estado: 'Draft' as VersionEstado,
    responsable: 'Equipo Dev',
    creadoEn: '2024-12-01T09:15:00Z'
  }
];

export const mockStats: DashboardStats = {
  versiones: {
    totalVersiones: mockVersiones.length,
    versionesPorEstado: {
      'Draft': 1,
      'Ready': 1,
      'Published': 1,
      'Sealed': 0
    },
    versionesRecientes: mockVersiones,
    artefactosPorTipo: {
      bin: 5,
      pkg: 3,
      doc: 8
    }
  },
  actividad: [],
  trabajosPendientes: 2
};

// Flag para usar datos mock durante desarrollo
export const USE_MOCK_DATA = true;