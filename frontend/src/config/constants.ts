export const APP_CONFIG = {
  name: 'Versiones App',
  description: 'Sistema Inteligente de Gestión de Versiones',
  version: '2.0.0',
  author: 'LIS Team',
} as const;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  VERSIONS: '/versions',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
} as const;

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

export const THEME_CONFIG = {
  defaultDarkMode: true,
  storageKey: 'darkMode',
  transitionDuration: 300,
} as const;

export const TOAST_CONFIG = {
  defaultDuration: 5000,
  maxToasts: 5,
  position: 'top-right',
} as const;

export const ANIMATION_CONFIG = {
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  },
  fast: {
    duration: 0.2,
  },
  normal: {
    duration: 0.3,
  },
  slow: {
    duration: 0.5,
  },
} as const;

export const VALIDATION_RULES = {
  version: {
    pattern: /^\d+\.\d+\.\d+$/,
    message: 'Formato válido: X.Y.Z',
  },
  build: {
    pattern: /^\d{6}$/,
    message: 'Formato válido: AAMMDD (6 dígitos)',
  },
  checksum: {
    pattern: /^[a-fA-F0-9]{32,128}$/,
    message: 'Checksum SHA256 válido requerido',
  },
} as const;

export const STATUS_CONFIG = {
  borrador: {
    label: 'Borrador',
    color: 'gray',
    icon: 'DocumentIcon',
  },
  listo: {
    label: 'Listo',
    color: 'yellow',
    icon: 'ClockIcon',
  },
  Certificado: {
    label: 'Certificado',
    color: 'green',
    icon: 'CheckCircleIcon',
  },
} as const;

export const TABLE_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  defaultSortField: 'createdAt',
  defaultSortOrder: 'desc' as const,
} as const;
