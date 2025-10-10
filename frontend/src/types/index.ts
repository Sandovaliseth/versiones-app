// Estados de versión basados en el backend
export type VersionEstado = 'Draft' | 'Ready' | 'Published' | 'Sealed';

// Tipos de artefacto
export type ArtefactoTipo = 'bin' | 'pkg' | 'doc';
export type ArtefactoRama = 'base' | 'aumento';

// Canales de comunicación
export type CanalComunicacion = 'outbox' | 'outlook' | 'teams';
export type StatusBorrador = 'DRAFT' | 'SENT' | 'FAILED';

// Estados de trabajos en cola
export type JobStatus = 'PENDING' | 'RUNNING' | 'OK' | 'ERROR';
export type JobType = 'COPY_ARTIFACTS' | 'COMPUTE_MD5' | 'GEN_OUTBOX' | 'CAPTURE_WIKI_SCREENSHOT' | 'PACKAGE_EVIDENCE';
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH';

// Entidad principal - Versión
export interface Version {
  id: string;
  cliente: string;
  nombre: string;
  numeroVersion: string;
  buildYyyymmdd: string;
  estado: VersionEstado;
  responsable: string;
  correlationId?: string;
  idempotencyKey?: string;
  branch?: string;
  releaseNotesPath?: string;
  creadoEn: string;
  actualizadoEn?: string;
}

// Artefacto relacionado a una versión
export interface Artefacto {
  id: string;
  versionId: string;
  tipo: ArtefactoTipo;
  rama: ArtefactoRama;
  nombreOriginal: string;
  nombreFinal: string;
  rutaDestino: string;
  sizeBytes?: number;
  md5?: string;
  uploadedUrl?: string;
  creadoEn: string;
}

// Borrador de comunicación
export interface Borrador {
  id: string;
  versionId: string;
  canal: CanalComunicacion;
  asunto: string;
  cuerpo: string;
  threadId?: string;
  status: StatusBorrador;
  evidenceZipPath?: string;
  creadoEn: string;
}

// Evento de auditoría
export interface EventoAuditoria {
  id: string;
  versionId: string;
  accion: string;
  actor: string;
  ipHost?: string;
  detalles?: string;
  timestamp: string;
}

// Trabajo en cola
export interface JobQueue {
  id: string;
  versionId: string;
  type: JobType;
  jobKey: string;
  payloadJson: string;
  status: JobStatus;
  priority: JobPriority;
  attempt: number;
  outputJson?: string;
  errorMsg?: string;
  createdAt: string;
  updatedAt?: string;
}

// DTOs para API
export interface CrearVersionRequest {
  cliente: string;
  nombre: string;
  numeroVersion: string;
  buildYyyymmdd: string;
  responsable: string;
}

export interface CrearVersionResponse {
  id: string;
  estado: VersionEstado;
}

export interface AdjuntarArtefactoRequest {
  tipo: ArtefactoTipo;
  rama: ArtefactoRama;
  file: File;
}

// Respuestas de API con metadatos
export interface ApiResponse<T> {
  data: T;
  message?: string;
  correlationId?: string;
}

export interface ApiError {
  timestamp: string;
  path: string;
  correlationId?: string;
  error: string;
  message: string;
  status: number;
}

// Filtros y paginación
export interface VersionFilters {
  cliente?: string;
  estado?: VersionEstado;
  responsable?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface PaginationParams {
  page: number;
  size: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Estados de la aplicación
export interface AppState {
  theme: 'light' | 'dark';
  user?: User;
  isLoading: boolean;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Configuración de la aplicación
export interface AppConfig {
  apiBaseUrl: string;
  enableDarkMode: boolean;
  enableNotifications: boolean;
  itemsPerPage: number;
}

// Props comunes para componentes
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: string;
  label?: string;
  helperText?: string;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'glass' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
}

export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
}

// Utilidades de estado
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data?: T;
  loading: boolean;
  error?: string;
}

// Notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Rutas de navegación
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType;
  badge?: string | number;
  children?: NavItem[];
}

// Métricas y analytics
export interface VersionMetrics {
  totalVersiones: number;
  versionesPorEstado: Record<VersionEstado, number>;
  versionesRecientes: Version[];
  artefactosPorTipo: Record<ArtefactoTipo, number>;
}

export interface DashboardStats {
  versiones: VersionMetrics;
  actividad: EventoAuditoria[];
  trabajosPendientes: number;
}

// Configuración de formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'file' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => boolean | string;
  };
}