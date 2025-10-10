export type TipoDocumento = 'firma' | 'certificacion';
export type TipoFirma = 'generica' | 'personalizada';

export interface CrearVersionData {
  // --- CAMPOS COMUNES (para FIRMA y CERTIFICACIÓN) ---
  cliente?: string;
  nombreVersionCliente?: string; // ENLACEAV
  terminal?: string;
  versionBase?: string;
  versionAumento?: string;
  build?: string;
  tipoFirma?: TipoFirma;
  cid?: string;
  descripcionBreve?: string;
  rutaCompilacion?: string;
  rutaLocal?: string;
  
  // --- CONTROL ---
  tipoDocumento: TipoDocumento;
  
  // --- CAMPOS EXCLUSIVOS DE CERTIFICACIÓN ---
  archivoPkg?: File; // Archivo .pkg para calcular checksum
  nombrePkg?: string;
  checksumPkg?: string; // Checksum calculado del archivo
  checksumCorreo?: string; // Checksum recibido por correo para validar
  linksOneDrive?: string;
  capturaEvidencia?: File;
  formatoRelease?: File; // Documento/formato del release
  
  // --- METADATOS OPCIONALES ---
  responsable?: string;
  departamento?: string;
  notasTecnicas?: string;
}

export const camposRequeridos = {
  firma: [
    'cliente',
    'nombreVersionCliente',
    'terminal',
    'versionBase',
    'versionAumento',
    'build',
    'rutaCompilacion',
    'descripcionBreve'
  ],
  certificacion: [
    'cliente',
    'nombreVersionCliente',
    'terminal',
    'versionBase',
    'versionAumento',
    'build',
    'rutaCompilacion',
    'descripcionBreve',
    'nombrePkg',
    'checksumPkg',
    'linksOneDrive'
  ]
};

export const initialFormData: CrearVersionData = {
  cliente: '',
  nombreVersionCliente: '',
  terminal: '',
  versionBase: '',
  versionAumento: '',
  build: '',
  tipoFirma: 'generica',
  cid: '0',
  descripcionBreve: '',
  rutaCompilacion: '',
  rutaLocal: '',
  tipoDocumento: 'firma',
  archivoPkg: undefined,
  nombrePkg: '',
  checksumPkg: '',
  checksumCorreo: '',
  linksOneDrive: '',
  capturaEvidencia: undefined,
  formatoRelease: undefined,
  responsable: '',
  departamento: '',
  notasTecnicas: ''
};
