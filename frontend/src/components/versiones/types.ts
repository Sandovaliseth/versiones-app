export type TipoDocumento = 'firma' | 'certificacion';
export type TipoFirma = 'generica' | 'personalizada';

export interface CrearVersionData {
  cliente?: string;
  nombreVersionCliente?: string;
  terminal?: string;
  esDemo?: boolean;
  versionBase?: string;
  versionAumento?: string;
  build?: string;
  incluirVersionAumento?: boolean;
  tipoFirma?: TipoFirma;
  cid?: string;
  descripcionBreve?: string;
  rutaCompilacion?: string;
  rutaLocal?: string;
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
  
  tipoDocumento: TipoDocumento;
  
  archivoPkg?: File;
  nombrePkg?: string;
  checksumPkg?: string;
  checksumCorreo?: string;
  linksOneDrive?: string;
  capturaEvidencia?: File;
  formatoRelease?: File;
  nombrePkgBase?: string;
  checksumPkgBase?: string;
  nombrePkgAumento?: string;
  checksumPkgAumento?: string;
  
  responsable?: string;
  departamento?: string;
  notasTecnicas?: string;
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
  esDemo: false,
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
