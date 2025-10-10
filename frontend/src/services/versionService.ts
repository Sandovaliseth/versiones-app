import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  Version, 
  CrearVersionRequest, 
  CrearVersionResponse,
  AdjuntarArtefactoRequest,

  PaginatedResponse,
  VersionFilters,
  PaginationParams,
  Artefacto,
  EventoAuditoria,
  DashboardStats
} from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor para correlation ID
    this.client.interceptors.request.use(
      (config) => {
        // Generar correlation ID si no existe
        if (!config.headers['X-Correlation-Id']) {
          config.headers['X-Correlation-Id'] = this.generateCorrelationId();
        }
        
        // Agregar timestamp
        config.metadata = { requestTime: Date.now() };
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para manejo de errores
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log performance en desarrollo
        if (import.meta.env.DEV) {
          const duration = Date.now() - (response.config.metadata?.requestTime || 0);
          console.log(`API Call: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
        }
        
        return response;
      },
      (error) => {
        // Manejo centralizado de errores
        if (error.response?.status === 401) {
          // Redirigir a login si es necesario
          console.warn('Unauthorized access');
        }
        
        return Promise.reject(error);
      }
    );
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Wrapper genérico para requests
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data) {
      const apiError = error.response.data;
      return new Error(apiError.message || 'Error en la API');
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return new Error('Error de conexión. Verifique su conexión a internet.');
    }
    
    return new Error(error.message || 'Error desconocido');
  }
}

class VersionService extends ApiService {
  // Obtener todas las versiones con filtros y paginación
  async getVersions(
    filters?: VersionFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Version>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    if (pagination) {
      params.append('page', pagination.page.toString());
      params.append('size', pagination.size.toString());
      if (pagination.sort) params.append('sort', pagination.sort);
      if (pagination.direction) params.append('direction', pagination.direction);
    }

    return this.request<PaginatedResponse<Version>>({
      method: 'GET',
      url: `/versiones${params.toString() ? `?${params.toString()}` : ''}`,
    });
  }

  // Obtener versión por ID
  async getVersion(id: string): Promise<Version> {
    return this.request<Version>({
      method: 'GET',
      url: `/versiones/${id}`,
    });
  }

  // Crear nueva versión
  async createVersion(data: CrearVersionRequest): Promise<CrearVersionResponse> {
    return this.request<CrearVersionResponse>({
      method: 'POST',
      url: '/versiones',
      data,
    });
  }

  // Actualizar estado de versión
  async updateVersionStatus(id: string, estado: string): Promise<Version> {
    return this.request<Version>({
      method: 'PATCH',
      url: `/versiones/${id}/estado`,
      data: { estado },
    });
  }

  // Adjuntar artefacto
  async uploadArtifact(
    versionId: string, 
    data: AdjuntarArtefactoRequest
  ): Promise<Artefacto> {
    const formData = new FormData();
    formData.append('tipo', data.tipo);
    formData.append('rama', data.rama);
    formData.append('file', data.file);

    return this.request<Artefacto>({
      method: 'POST',
      url: `/versiones/${versionId}/artefactos`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Obtener artefactos de una versión
  async getArtifacts(versionId: string): Promise<Artefacto[]> {
    return this.request<Artefacto[]>({
      method: 'GET',
      url: `/versiones/${versionId}/artefactos`,
    });
  }

  // Validar versión (cambiar a Ready)
  async validateVersion(id: string): Promise<Version> {
    return this.request<Version>({
      method: 'POST',
      url: `/versiones/${id}/validar`,
    });
  }

  // Publicar versión (cambiar a Published)
  async publishVersion(id: string): Promise<Version> {
    return this.request<Version>({
      method: 'POST',
      url: `/versiones/${id}/publicar`,
    });
  }

  // Enviar firma
  async sendSignature(id: string, data: { responsable: string; comentarios?: string }): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: `/versiones/${id}/firma`,
      data,
    });
  }

  // Enviar certificación
  async sendCertification(id: string, data: { certificador: string; aprobado: boolean; comentarios?: string }): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: `/versiones/${id}/certificacion`,
      data,
    });
  }

  // Generar release notes
  async generateReleaseNotes(id: string): Promise<{ path: string; content: string }> {
    return this.request<{ path: string; content: string }>({
      method: 'POST',
      url: `/versiones/${id}/release-notes`,
    });
  }

  // Obtener historial de auditoría
  async getAuditHistory(versionId: string): Promise<EventoAuditoria[]> {
    return this.request<EventoAuditoria[]>({
      method: 'GET',
      url: `/versiones/${versionId}/auditoria`,
    });
  }

  // Eliminar versión
  async deleteVersion(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/versiones/${id}`,
    });
  }
}

class DashboardService extends ApiService {
  // Obtener estadísticas del dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>({
      method: 'GET',
      url: '/dashboard/stats',
    });
  }

  // Obtener actividad reciente
  async getRecentActivity(limit = 10): Promise<EventoAuditoria[]> {
    return this.request<EventoAuditoria[]>({
      method: 'GET',
      url: `/dashboard/activity?limit=${limit}`,
    });
  }
}

// Instancias exportadas
export const versionService = new VersionService();
export const dashboardService = new DashboardService();

// Configuración de axios para uso global
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Helper para manejo de archivos
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Error al descargar el archivo');
  }
};

// Helper para formato de fechas
export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

// Helper para tamaño de archivos
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};