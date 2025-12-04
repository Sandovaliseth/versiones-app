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
  incluirVersionAumento?: boolean;
  tipoFirma?: TipoFirma;
  cid?: string;
  descripcionBreve?: string;
  rutaCompilacion?: string;
  rutaLocal?: string;
  // Campos para compilación automática y checksums
  rutaProyecto?: string;
  archivoVersion?: string;
  nombreArchivoBin?: string;
  archivoBinBase?: string;
  archivoBinAumento?: string;
  comandoCompilacion?: string;
  compilePyMode?: string;
  compilePyTarget?: string;
  checksumBase?: string;
  checksumAumento?: string;
  
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
  // Campos para certificación con AUMENTO
  nombrePkgBase?: string;
  checksumPkgBase?: string;
  nombrePkgAumento?: string;
  checksumPkgAumento?: string;
  
  // --- METADATOS OPCIONALES ---
  responsable?: string;
  departamento?: string;
  notasTecnicas?: string;
  // --- Mapping to drafted email subject (optional) - used so the app can map replies to versions
  outlookSubject?: string;
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
  incluirVersionAumento: false,
  build: '',
  tipoFirma: 'generica',
  cid: '0',
  descripcionBreve: '',
  rutaCompilacion: '',
  rutaLocal: '',
  rutaProyecto: '',
  archivoVersion: '',
  nombreArchivoBin: '',
  archivoBinBase: '',
  archivoBinAumento: '',
  comandoCompilacion: '',
  compilePyMode: '2',
  compilePyTarget: '2',
  checksumBase: '',
  checksumAumento: '',
  tipoDocumento: 'firma',
  archivoPkg: undefined,
  nombrePkg: '',
  checksumPkg: '',
  checksumCorreo: '',
  linksOneDrive: '',
  capturaEvidencia: undefined,
  formatoRelease: undefined,
  nombrePkgBase: '',
  checksumPkgBase: '',
  nombrePkgAumento: '',
  checksumPkgAumento: '',
  outlookSubject: '',
  responsable: '',
  departamento: '',
  notasTecnicas: ''
};
