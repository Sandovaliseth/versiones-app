import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DocumentTextIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { CrearVersionData, initialFormData } from './types';
import { useVersionValidation } from './useVersionValidation';
import { FormSection, TextField, TextAreaField, FileField, PathField } from './FormComponents';
import { getTodayYYMMDD, crearCorreoHtml } from './helpers';

type BinTokenContext = {
  rawTokens: string[];
  sanitizedTokens: string[];
};

interface BinSelectionContext extends BinTokenContext {
  preferredDir?: string;
  projectRoot?: string;
  currentBinName?: string;
}

interface BinCandidateScore {
  path: string;
  score: number;
  reasons: string[];
}

const normalizeTokenValue = (value?: string): string => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const buildBinTokenContext = (...values: Array<string | undefined>): BinTokenContext => {
  const rawTokens = new Set<string>();
  const sanitizedTokens = new Set<string>();

  const addValue = (value?: string) => {
    const normalized = normalizeTokenValue(value);
    if (!normalized) return;

    const variations = [
      normalized,
      normalized.replace(/\s+/g, ''),
      normalized.replace(/[^a-z0-9]+/g, '_'),
      normalized.replace(/[^a-z0-9]+/g, '-'),
      normalized.replace(/[^a-z0-9]/g, '')
    ];

    variations.forEach((variant) => {
      const trimmed = variant.trim();
      if (!trimmed) return;
      rawTokens.add(trimmed);
      const sanitized = trimmed.replace(/[^a-z0-9]/g, '');
      if (sanitized) {
        sanitizedTokens.add(sanitized);
      }
    });
  };

  values.forEach(addValue);

  return {
    rawTokens: Array.from(rawTokens),
    sanitizedTokens: Array.from(sanitizedTokens)
  };
};

const normalizeSlashes = (value: string): string => value.replace(/\//g, '\\');

const includesDirKeyword = (path: string, keyword: string): boolean => {
  const marker = `\\${keyword}\\`;
  return path.includes(marker) || path.endsWith(`\\${keyword}`) || path.includes(`\\${keyword}.`);
};

const isEmojiChar = (char?: string): boolean => {
  if (!char) return false;
  const code = char.codePointAt(0);
  if (!code) return false;
  return (
    (code >= 0x1f300 && code <= 0x1f6ff) ||
    (code >= 0x1f900 && code <= 0x1f9ff) ||
    (code >= 0x2600 && code <= 0x27bf)
  );
};

const stripLeadingEmoji = (value: string): { text: string; hadEmoji: boolean } => {
  const trimmed = value?.trim() || '';
  if (!trimmed) return { text: '', hadEmoji: false };
  const chars = Array.from(trimmed);
  if (chars.length === 0) return { text: trimmed, hadEmoji: false };
  if (isEmojiChar(chars[0])) {
    return { text: chars.slice(1).join('').trimStart(), hadEmoji: true };
  }
  return { text: trimmed, hadEmoji: false };
};

const selectBestBinCandidate = (matches: string[] = [], context: BinSelectionContext): BinCandidateScore | null => {
  if (!Array.isArray(matches) || matches.length === 0) return null;

  const normalizedPreferred = context.preferredDir ? normalizeSlashes(context.preferredDir).toLowerCase() : '';
  const normalizedProjectRoot = context.projectRoot ? normalizeSlashes(context.projectRoot).toLowerCase() : '';
  const normalizedCurrentBin = context.currentBinName ? context.currentBinName.toLowerCase() : '';
  const rawTokens = context.rawTokens || [];
  const sanitizedTokens = context.sanitizedTokens || [];

  const limitedMatches = matches.slice(0, 150);
  let best: BinCandidateScore | null = null;

  for (const candidate of limitedMatches) {
    if (!candidate) continue;
    const normalizedPath = normalizeSlashes(candidate).toLowerCase();
    const sanitizedPath = normalizedPath.replace(/[^a-z0-9]/g, '');
    const segments = normalizedPath.split('\\').filter(Boolean);
    const fileName = segments[segments.length - 1] || normalizedPath;
    const fileNameLower = fileName.toLowerCase();
    const sanitizedName = fileNameLower.replace(/[^a-z0-9]/g, '');

    let score = 0;
    const reasons: string[] = [];

    if (normalizedPreferred && normalizedPath.startsWith(normalizedPreferred)) {
      score += 6;
      reasons.push('Dentro de la carpeta de compilación sugerida');
    }

    if (normalizedProjectRoot && normalizedPath.startsWith(normalizedProjectRoot)) {
      score += 4;
      reasons.push('Dentro de la ruta del proyecto');
    }

    const depth = segments.length;
    if (depth > 0) {
      const proximity = Math.max(0, 12 - depth) * 0.5;
      score += proximity;
    }

    const favoredDirs = [
      { key: 'release', value: 4, label: 'release' },
      { key: 'dist', value: 3, label: 'dist' },
      { key: 'output', value: 3, label: 'output' },
      { key: 'telecarga', value: 3, label: 'telecarga' },
      { key: 'firmware', value: 3, label: 'firmware' },
      { key: 'deploy', value: 2, label: 'deploy' },
      { key: 'bin', value: 2, label: 'bin' },
      { key: 'build', value: 2, label: 'build' }
    ];

    favoredDirs.forEach(({ key, value, label }) => {
      if (includesDirKeyword(normalizedPath, key)) {
        score += value;
        reasons.push(`Carpeta ${label}`);
      }
    });

    const penalizedDirs = [
      { key: 'backup', value: -5 },
      { key: 'respaldo', value: -5 },
      { key: 'respald', value: -4 },
      { key: 'old', value: -4 },
      { key: 'tmp', value: -3 },
      { key: 'temp', value: -3 },
      { key: 'cache', value: -2 },
      { key: 'log', value: -1 },
      { key: '~', value: -1 }
    ];

    penalizedDirs.forEach(({ key, value }) => {
      if (includesDirKeyword(normalizedPath, key) || normalizedPath.includes(key)) {
        score += value;
      }
    });

    rawTokens.forEach((token) => {
      if (!token) return;
      const normalizedToken = token.toLowerCase();
      if (fileNameLower.includes(normalizedToken)) {
        score += 6;
        reasons.push(`Nombre contiene "${normalizedToken}"`);
      } else if (normalizedPath.includes(normalizedToken)) {
        score += 2;
      }
    });

    sanitizedTokens.forEach((token) => {
      if (!token) return;
      if (sanitizedName.includes(token)) {
        score += 4;
      } else if (sanitizedPath.includes(token)) {
        score += 1;
      }
    });

    if (normalizedCurrentBin && fileNameLower === normalizedCurrentBin) {
      score += 8;
      reasons.push('Coincide con selección previa');
    }

    if (/aumento|release|prod/.test(fileNameLower)) {
      score += 1.5;
    }
    if (/debug|test|old/.test(fileNameLower)) {
      score -= 2;
    }

    if (!best || score > best.score) {
      best = { path: candidate, score, reasons };
    }
  }

  return best;
};

const CHECKSUM_RECOMPILE_MESSAGE = 'Los checksums BASE y AUMENTO son idénticos. Ejecuta "make clean" (o limpia completamente tu proyecto) y vuelve a compilar para generar un binario diferente.';

const normalizeWindowsSlashes = (value: string) => value.replace(/\//g, '\\');
const isAbsoluteWindowsPath = (value: string) => /^(?:[a-zA-Z]:\\|\\\\)/.test(value);

const resolveProjectFilePath = (projectRoot?: string, relativeOrAbsolute?: string) => {
  if (!relativeOrAbsolute) return null;
  const trimmed = relativeOrAbsolute.trim();
  if (!trimmed) return null;
  const normalizedTarget = normalizeWindowsSlashes(trimmed);
  if (isAbsoluteWindowsPath(normalizedTarget)) {
    return normalizedTarget;
  }
  if (!projectRoot) {
    return normalizedTarget;
  }
  const normalizedRoot = normalizeWindowsSlashes(projectRoot).replace(/[\\/]+$/, '');
  const sanitizedRelative = normalizedTarget.replace(/^[\\/]+/, '');
  return `${normalizedRoot}\\${sanitizedRelative}`;
};

const sanitizePathSegment = (value?: string) => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[^\w\d-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
};

const buildHistorialFolderName = (data: CrearVersionData) => {
  const cliente = sanitizePathSegment(data.nombreVersionCliente || data.cliente || 'VERSION');
  const base = sanitizePathSegment(data.versionBase || '0');
  const build = sanitizePathSegment(data.build || getTodayYYMMDD());
  return `VERSION_${cliente}${base}_${build}`;
};

const getFirstMatchPath = (result: any): string | null => {
  if (!result) return null;
  if (typeof result === 'string') return result;
  if (Array.isArray(result)) return result[0] ?? null;
  if (Array.isArray(result.matches)) return result.matches[0] ?? null;
  if (typeof result.path === 'string') return result.path;
  return null;
};

interface CrearVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearVersionData) => void;
}

const FIELD_LABELS: Partial<Record<keyof CrearVersionData, string>> = {
  cliente: 'Cliente',
  nombreVersionCliente: 'Nombre versión cliente',
  terminal: 'Terminal',
  versionBase: 'Versión base',
  versionAumento: 'Versión aumento',
  build: 'Build',
  rutaProyecto: 'Ruta del proyecto',
  nombreArchivoBin: 'Archivo .bin',
  descripcionBreve: 'Descripción breve',
  nombrePkg: 'Nombre del .pkg',
  checksumPkg: 'Checksum del .pkg',
  linksOneDrive: 'Links de OneDrive',
  nombrePkgBase: 'Nombre pkg BASE',
  checksumPkgBase: 'Checksum pkg BASE',
  nombrePkgAumento: 'Nombre pkg AUMENTO',
  checksumPkgAumento: 'Checksum pkg AUMENTO'
};

export default function CrearVersionModal({ isOpen, onClose, onSubmit }: CrearVersionModalProps) {
  const loadPreferences = (): Partial<CrearVersionData> => {
    try {
      const saved = localStorage.getItem('versiones-app:preferencias-formulario');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error cargando preferencias:', error);
    }
    return {};
  };

  const [formData, setFormData] = useState<CrearVersionData>(() => ({
    ...initialFormData,
    ...loadPreferences()
  }));
  const { errors, validateForm, clearErrors } = useVersionValidation();
  const [showMetadata, setShowMetadata] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [artifactHints, setArtifactHints] = useState<{ binPath: string | null; headerPath: string | null; isSearching: boolean }>({
    binPath: null,
    headerPath: null,
    isSearching: false
  });
  const supportsProjectLookup = typeof window !== 'undefined' && Boolean(window.electronAPI?.findFiles);
  
  const [isCalculatingChecksums, setIsCalculatingChecksums] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const progressDisplay = useMemo(() => {
    const raw = progressStep || '';
    const normalized = raw.trim();
    const status: 'success' | 'error' | 'loading' = normalized.includes('✅')
      ? 'success'
      : normalized.includes('❌')
        ? 'error'
        : 'loading';
    const stripped = stripLeadingEmoji(normalized);
    const text = stripped.text || normalized;
    return { text, status };
  }, [progressStep]);
  const [showAumentoConfirm, setShowAumentoConfirm] = useState(false);
  const [waitingForAumentoCompile, setWaitingForAumentoCompile] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; title: string; message: string }>({ show: false, title: '', message: '' });
  const [compilationDetected, setCompilationDetected] = useState(false);
  const [showTipoFirmaOptions, setShowTipoFirmaOptions] = useState(false);
  const tipoFirmaRef = useRef<HTMLDivElement | null>(null);
  const [showCompilacionAuto, setShowCompilacionAuto] = useState(false);
  const [checksumWarning, setChecksumWarning] = useState<string>('');
  const [copiedErrorPath, setCopiedErrorPath] = useState(false);
  const [lastHistorialPath, setLastHistorialPath] = useState<string | null>(null);
  const [lastHistorialZip, setLastHistorialZip] = useState<string | null>(null);
  const [copiedHistorial, setCopiedHistorial] = useState<'folder' | 'zip' | null>(null);
  const hasHistorialInfo = Boolean(lastHistorialPath || lastHistorialZip);
  const [lastPersonalizedCid, setLastPersonalizedCid] = useState<string>(() => {
    const prefs = loadPreferences();
    return (prefs.tipoFirma === 'personalizada' && prefs.cid && prefs.cid !== '0') ? String(prefs.cid) : '';
  });
  const isSubmittingRef = useRef(false);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkFileIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectTargetsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const historialFolderRef = useRef<string | null>(null);
  const historialZipRef = useRef<string | null>(null);
  const parsedErrorMessage = useMemo(() => {
    const paragraphs: string[] = [];
    const bulletItems: string[] = [];
    let filePath = '';

    if (!errorModal.message) {
      return { paragraphs, bulletItems, filePath };
    }

    const segments = errorModal.message
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    segments.forEach((segment) => {
      if (/^archivo:/i.test(segment)) {
        filePath = segment.replace(/^archivo:\s*/i, '');
        return;
      }
      if (segment.startsWith('•')) {
        bulletItems.push(segment.replace(/^•\s*/, ''));
        return;
      }
      paragraphs.push(segment);
    });

    return { paragraphs, bulletItems, filePath };
  }, [errorModal.message]);

  const handleCopyErrorPath = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedErrorPath(true);
      setTimeout(() => setCopiedErrorPath(false), 1500);
    } catch (copyError) {
      console.warn('No se pudo copiar la ruta del error:', copyError);
    }
  };

  const handleCopyHistorialPath = async (value: string | null, kind: 'folder' | 'zip') => {
    if (!value || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedHistorial(kind);
      setTimeout(() => setCopiedHistorial(null), 1500);
    } catch (copyError) {
      console.warn('No se pudo copiar la ruta del historial:', copyError);
    }
  };

  const getHistorialFolderPath = () => {
    const basePath = resolveVersionesBasePath();
    if (!basePath) return '';
    const normalizedRoot = normalizeWindowsSlashes(basePath).replace(/[\\/]+$/, '');
    const folderName = buildHistorialFolderName(formData);
    return `${normalizedRoot}\\${folderName}`;
  };

  const ensureHistorialFolder = async (): Promise<string | null> => {
    if (!window.electronAPI) return null;
    const folderPath = getHistorialFolderPath();
    if (!folderPath) return null;
    await window.electronAPI.createDirectory(folderPath);
    await window.electronAPI.createDirectory(`${folderPath}\\BASE`);
    await window.electronAPI.createDirectory(`${folderPath}\\AUMENTO`);
    historialFolderRef.current = folderPath;
    setLastHistorialPath(folderPath);
    return folderPath;
  };

  const actualizarChecksumsFile = async (folderPath: string, md5Base?: string, md5Aumento?: string) => {
    if (!window.electronAPI || !folderPath) return;
    const checksumBaseLine = `CHECKSUM BASE: ${md5Base || 'PENDIENTE'}`;
    const checksumAumentoLine = `CHECKSUM AUMENTO: ${md5Aumento || 'PENDIENTE'}`;
    await window.electronAPI.writeTextFile(
      `${folderPath}\\Checksums.txt`,
      `${checksumBaseLine}\n${checksumAumentoLine}\n`
    );
  };

  const zipHistorialFolder = async (folderPath: string): Promise<string | null> => {
    if (!window.electronAPI?.zipArtifacts || !folderPath) return null;
    try {
      const folderName = folderPath.split(/[/\\]/).filter(Boolean).pop() || `version_${Date.now()}`;
      const zipResult = await window.electronAPI.zipArtifacts({
        files: [folderPath],
        zipName: `${folderName}.zip`,
        subfolder: formData.cliente || folderName
      });
      if (zipResult?.ok && zipResult.path) {
        historialZipRef.current = zipResult.path;
        setLastHistorialZip(zipResult.path);
        return zipResult.path;
      }
    } catch (zipError) {
      console.warn('No se pudo generar el ZIP del historial:', zipError);
    }
    return null;
  };

  const snapshotBaseBinary = async (sourceBinPath: string, checksumBase: string | null) => {
    if (!window.electronAPI || !sourceBinPath || !checksumBase) return;
    try {
      const exists = await window.electronAPI.fileExists(sourceBinPath);
      if (!exists) return;
      const folderPath = historialFolderRef.current || await ensureHistorialFolder();
      if (!folderPath) return;
      await window.electronAPI.copyFile(sourceBinPath, `${folderPath}\\BASE\\${formData.nombreArchivoBin}`);
      await actualizarChecksumsFile(folderPath, checksumBase, undefined);
    } catch (snapshotError) {
      console.warn('No se pudo guardar el binario BASE en el historial:', snapshotError);
    }
  };

  const registrarAumentoEnHistorial = async (md5Base?: string, md5Aumento?: string) => {
    if (!window.electronAPI) return { folderPath: null, zipPath: null };
    const folderPath = historialFolderRef.current || await ensureHistorialFolder();
    if (!folderPath) return { folderPath: null, zipPath: null };
    if (!formData.rutaCompilacion || !formData.nombreArchivoBin) {
      console.warn('No hay ruta/nombre de binario definidos para registrar el historial.');
      return { folderPath, zipPath: null };
    }
    const sourceBinPath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;

    try {
      if (md5Aumento) {
        const exists = await window.electronAPI.fileExists(sourceBinPath);
        if (exists) {
          await window.electronAPI.copyFile(sourceBinPath, `${folderPath}\\AUMENTO\\${formData.nombreArchivoBin}`);
        }
      }
      await actualizarChecksumsFile(folderPath, md5Base, md5Aumento);
      const zipPath = await zipHistorialFolder(folderPath);
      return { folderPath, zipPath };
    } catch (historialError) {
      console.warn('No se pudo completar el historial de versiones:', historialError);
      return { folderPath, zipPath: null };
    }
  };

  const crearEstructuraCarpetas = async (md5Base?: string | null, md5Aumento?: string | null): Promise<string | null> => {
    if (!window.electronAPI) return null;
    try {
      const folderPath = historialFolderRef.current || await ensureHistorialFolder();
      if (!folderPath) return null;
      const baseValue = md5Base ?? formData.checksumBase ?? undefined;
      const aumentoValue = md5Aumento ?? formData.checksumAumento ?? undefined;
      await actualizarChecksumsFile(folderPath, baseValue, aumentoValue);
      setLastHistorialPath(folderPath);
      setFormData(prev => prev.linksOneDrive === folderPath ? prev : ({ ...prev, linksOneDrive: folderPath }));
      return folderPath;
    } catch (carpetasError) {
      console.warn('No se pudo actualizar la estructura de carpetas:', carpetasError);
      return null;
    }
  };

  useEffect(() => {
    if (!errorModal.show && copiedErrorPath) {
      setCopiedErrorPath(false);
    }
  }, [errorModal.show, copiedErrorPath]);

  useEffect(() => {
    if (!supportsProjectLookup) {
      return;
    }

    const projectPath = formData.rutaProyecto?.trim();
    const binName = formData.nombreArchivoBin?.trim();
    const headerName = formData.archivoVersion?.trim();

    if (!projectPath || (!binName && !headerName)) {
      setArtifactHints({ binPath: null, headerPath: null, isSearching: false });
      return;
    }

    let cancelled = false;
    setArtifactHints((prev) => ({ ...prev, isSearching: true }));

    const timer = setTimeout(async () => {
      if (cancelled || !window.electronAPI?.findFiles) {
        setArtifactHints({ binPath: null, headerPath: null, isSearching: false });
        return;
      }

      try {
        const [binResult, headerResult] = await Promise.all([
          binName ? window.electronAPI.findFiles(projectPath, [binName]) : null,
          headerName ? window.electronAPI.findFiles(projectPath, [headerName]) : null
        ]);

        if (cancelled) return;

        setArtifactHints({
          binPath: getFirstMatchPath(binResult),
          headerPath: getFirstMatchPath(headerResult),
          isSearching: false
        });
      } catch (lookupError) {
        if (cancelled) return;
        console.warn('No se pudieron detectar los artefactos automáticamente:', lookupError);
        setArtifactHints({ binPath: null, headerPath: null, isSearching: false });
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [supportsProjectLookup, formData.rutaProyecto, formData.nombreArchivoBin, formData.archivoVersion]);

  const includeAumentoCert = formData.incluirVersionAumento ?? false;
  
  const fieldRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const shouldShowBinHint = Boolean(
    supportsProjectLookup &&
    formData.rutaProyecto &&
    formData.nombreArchivoBin &&
    (artifactHints.isSearching || artifactHints.binPath)
  );

  const shouldShowHeaderHint = Boolean(
    supportsProjectLookup &&
    formData.rutaProyecto &&
    formData.archivoVersion &&
    (artifactHints.isSearching || artifactHints.headerPath)
  );

  const resolveVersionesBasePath = () => {
    if (formData.rutaLocal && formData.rutaLocal.trim()) {
      return formData.rutaLocal.trim();
    }
    const username = typeof process !== 'undefined' && typeof process.env !== 'undefined'
      ? process.env.USERNAME || process.env.USER || ''
      : '';
    if (username) {
      return `C:\\Users\\${username}\\OneDrive\\Versiones`;
    }
    return '';
  };

  const focusNextField = (currentField: string) => {
    const fieldOrder = [
      'cliente',
      'nombreVersionCliente',
      'terminal',
      'versionBase',
      'versionAumento',
      'build'
    ];
    
    const currentIndex = fieldOrder.indexOf(currentField);
    if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
      const nextField = fieldOrder[currentIndex + 1];
      const nextInput = fieldRefs.current[nextField];
      if (nextInput) {
        setTimeout(() => nextInput.focus(), 50);
      }
    }
  };

  const handleInputChange = (field: keyof CrearVersionData, value: any) => {
    if (formAlert) {
      setFormAlert(null);
    }
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Recordar el CID personalizado cuando se edita
      if (field === 'cid') {
        if (prev.tipoFirma === 'personalizada' && value && value !== '0') {
          setLastPersonalizedCid(String(value));
        }
      }

      // Al cambiar tipo de firma, forzar '0' si es genérica; restaurar último CID si es personalizada
      if (field === 'tipoFirma') {
        if (value === 'generica') {
          newData.cid = '0';
        } else if (value === 'personalizada') {
          newData.cid = lastPersonalizedCid || (prev.cid !== '0' ? prev.cid : '');
        }
      }
      
      try {
        const preferencesToSave = {
          cliente: newData.cliente,
          terminal: newData.terminal,
          responsable: newData.responsable,
          tipoFirma: newData.tipoFirma,
          cid: newData.cid,
          rutaCompilacion: newData.rutaCompilacion,
          rutaLocal: newData.rutaLocal,
          tipoDocumento: newData.tipoDocumento,
          versionBase: newData.versionBase,
          versionAumento: newData.versionAumento,
          descripcionBreve: newData.descripcionBreve,
          departamento: newData.departamento,
          notasTecnicas: newData.notasTecnicas,
          nombrePkgBase: newData.nombrePkgBase,
              // Guardar también estos campos que antes no se persistían
          nombreVersionCliente: newData.nombreVersionCliente,
          nombreArchivoBin: newData.nombreArchivoBin,
          linksOneDrive: newData.linksOneDrive,
          // Campos de compilación automática
          rutaProyecto: newData.rutaProyecto,
          archivoVersion: newData.archivoVersion,
          comandoCompilacion: newData.comandoCompilacion,
          compilePyMode: newData.compilePyMode,
          compilePyTarget: newData.compilePyTarget,
          incluirVersionAumento: newData.incluirVersionAumento,
        };
        localStorage.setItem('versiones-app:preferencias-formulario', JSON.stringify(preferencesToSave));
      } catch (error) {
        console.error('Error guardando preferencias:', error);
      }
      
      return newData;
    });
  };

  const handleRutaProyectoChange = (value: string) => {
    handleInputChange('rutaProyecto', value);
    handleInputChange('rutaCompilacion', value);
  };

  const toggleIncludeAumento = () => {
    const nextValue = !includeAumentoCert;
    handleInputChange('incluirVersionAumento', nextValue as CrearVersionData['incluirVersionAumento']);
  };

  // Función para actualizar archivo .h con nueva versión
  const updateVersionInFile = async (filePath: string, newVersion: string): Promise<boolean> => {
    try {
      // Validar que los campos requeridos estén presentes
      if (!filePath || !newVersion) {
        console.error('❌ Faltan parámetros: filePath o newVersion');
        return false;
      }

      // Normalizar la ruta (reemplazar / por \\)
      const normalizedPath = filePath.replace(/\//g, '\\');
      console.log(`📝 Actualizando ${normalizedPath} con versión ${newVersion}`);
      
      // Verificar que el archivo existe
      const exists = await window.electronAPI.fileExists(normalizedPath);
      if (!exists) {
        console.error(`❌ El archivo no existe: ${normalizedPath}`);
        return false;
      }
      
      const result = await window.electronAPI.readTextFile(normalizedPath);
      if (!result.ok || !result.content) {
        console.error('❌ No se pudo leer el archivo:', result.error);
        return false;
      }
      
      let content = result.content;
      let updated = false;
      
      // Pattern 1: #define VERSION "X.Y.Z"
      if (/#define\s+VERSION\s+"[\d.]+"/.test(content)) {
        content = content.replace(
          /#define\s+VERSION\s+"[\d.]+"/g,
          `#define VERSION "${newVersion}"`
        );
        updated = true;
      }
      
      // Pattern 2: #define VERSION_MAJOR/MINOR/PATCH
      const [major, minor, patch] = newVersion.split('.');
      if (/#define\s+VERSION_MAJOR/.test(content)) {
        if (major) content = content.replace(/#define\s+VERSION_MAJOR\s+\d+/g, `#define VERSION_MAJOR ${major}`);
        if (minor) content = content.replace(/#define\s+VERSION_MINOR\s+\d+/g, `#define VERSION_MINOR ${minor}`);
        if (patch) content = content.replace(/#define\s+VERSION_PATCH\s+\d+/g, `#define VERSION_PATCH ${patch}`);
        updated = true;
      }
      
      // Pattern 3: #define <CUALQUIER_NOMBRE> "PREFIJO_X_Y_Z" (formato con prefijo y guiones bajos)
      // Busca CUALQUIER variable #define que tenga un valor con formato PREFIJO_DIGITOS_DIGITOS
      // Ejemplos: APP_MAIN_VER, VERSION_MAIN, MAIN_VER, FIRMWARE_VER, etc.
      const mainVerPattern = /#define\s+([A-Z_]+)\s+"([A-Za-z_]*\d+_\d+(?:_\d+)?)"/g;
      let mainVerMatch;
      const mainVerMatches = [];
      
      // Buscar TODAS las coincidencias
      while ((mainVerMatch = mainVerPattern.exec(content)) !== null) {
        mainVerMatches.push({
          fullMatch: mainVerMatch[0],
          varName: mainVerMatch[1],
          currentValue: mainVerMatch[2]
        });
      }
      
      // Filtrar solo las que NO sean de fecha (no tengan 8 dígitos consecutivos como 20251118)
      const validMainVerMatches = mainVerMatches.filter(m => 
        !/^\d{8}$/.test(m.currentValue) && // No es fecha pura
        !/^([A-Za-z_]+)?\d{8}$/.test(m.currentValue) // No termina en fecha YYYYMMDD
      );
      
      if (validMainVerMatches.length > 0) {
        // Tomar la primera coincidencia válida
        const match = validMainVerMatches[0];
        console.log(`Detectado #define ${match.varName} con valor: "${match.currentValue}"`);
        
        // Extraer el prefijo dinámicamente (cualquier letra/underscore al inicio)
        // Ejemplos: "ENLACEAV1_20" -> "ENLACEAV", "BANCO2_5" -> "BANCO", "V1_0" -> "V"
        const prefixMatch = match.currentValue.match(/^([A-Za-z_]*)/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        
        // Usar la versión TAL CUAL viene del formulario (respetar formato con puntos o guiones bajos)
        const newMainVer = prefix ? `${prefix}${newVersion}` : newVersion;
        
        console.log(`Actualizando ${match.varName}: "${match.currentValue}" -> "${newMainVer}"`);
        
        // Reemplazar específicamente esta variable
        const replacePattern = new RegExp(`#define\\s+${match.varName}\\s+"[^"]+"`, 'g');
        content = content.replace(replacePattern, `#define ${match.varName} "${newMainVer}"`);
        updated = true;
      }
      
      // Pattern 4: #define <CUALQUIER_NOMBRE> "20251010" (formato fecha YYYYMMDD)
      // Busca CUALQUIER variable que tenga un valor de 8 dígitos (formato fecha)
      // Ejemplos: APP_SUB_VER, BUILD_DATE, VERSION_DATE, etc.
      const subVerPattern = /#define\s+([A-Z_]+)\s+"(\d{8})"/g;
      let subVerMatch;
      const subVerMatches = [];
      
      while ((subVerMatch = subVerPattern.exec(content)) !== null) {
        subVerMatches.push({
          fullMatch: subVerMatch[0],
          varName: subVerMatch[1],
          currentValue: subVerMatch[2]
        });
      }
      
      if (subVerMatches.length > 0) {
        const match = subVerMatches[0];
        
        // Generar fecha actual en formato YYYYMMDD
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        
        console.log(`Detectado #define ${match.varName} con fecha: ${match.currentValue}`);
        console.log(`Actualizando ${match.varName} a fecha actual: ${dateStr}`);
        
        // Reemplazar específicamente esta variable
        const replacePattern = new RegExp(`#define\\s+${match.varName}\\s+"\\d{8}"`, 'g');
        content = content.replace(replacePattern, `#define ${match.varName} "${dateStr}"`);
        updated = true;
      }
      
      // Pattern 5: Detectar otras variables tipo versión (solo informativo, no se modifican)
      const otherVerPattern = /#define\s+([A-Z_]+(?:PARAM|CONFIG|BUILD)(?:_VERSION)?)\s+"([^"]+)"/g;
      let otherMatch;
      while ((otherMatch = otherVerPattern.exec(content)) !== null) {
        console.log(`${otherMatch[1]} detectado con valor "${otherMatch[2]}" - se mantiene sin cambios`);
      }
      
      if (!updated) {
        console.error('❌ No se encontró ningún patrón de versión conocido en el archivo');
        return false;
      }
      
      const writeResult = await window.electronAPI.writeTextFile(normalizedPath, content);
      if (!writeResult.ok) {
        console.error('❌ No se pudo escribir el archivo:', writeResult.error);
        return false;
      }
      
      console.log('✅ Versión actualizada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error actualizando versión:', error);
      return false;
    }
  };

  // Función para capturar pantalla del ejecutable
  const capturarPantalla = async (carpetaBase: string): Promise<void> => {
    try {
      if (!window.electronAPI) {
        console.warn('⚠️ Captura de pantalla solo disponible en Electron');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const nombreArchivo = `screenshot_${formData.cliente}_${formData.terminal}_${timestamp}.png`;
      const rutaCompleta = `${carpetaBase}\\${nombreArchivo}`;

      const resultado = await window.electronAPI.captureScreenshot({
        outputPath: rutaCompleta
      });

      if (resultado.ok) {
        console.log(`✅ Captura guardada: ${resultado.path}`);
      } else {
        console.error(`❌ Error capturando pantalla: ${resultado.error}`);
      }
    } catch (error) {
      console.error('❌ Error capturando pantalla:', error);
    }
  };

  // Crear correo en Outlook (delegando la generación de HTML al helper modular)
  const crearCorreoOutlook = async (
    md5Aumento: string | '',
    carpetaOneDrive?: string | null,
    historialZipPath?: string | null
  ): Promise<string> => {
    try {
      if (!window.electronAPI) {
        console.warn('⚠️ Creación de correo solo disponible en Electron');
        return '';
      }

      const { subject, body } = crearCorreoHtml(formData as any, md5Aumento || undefined, carpetaOneDrive || null);

      // Preparar lista de archivos a adjuntar
      const attachments: string[] = [];
      if (historialZipPath && await window.electronAPI.fileExists(historialZipPath)) {
        attachments.push(historialZipPath);
      }
      if (carpetaOneDrive) {
        const baseFilePath = `${carpetaOneDrive}\\BASE\\${formData.nombreArchivoBin}`;
        if (await window.electronAPI.fileExists(baseFilePath)) attachments.push(baseFilePath);
        if (md5Aumento) {
          const aumentoFilePath = `${carpetaOneDrive}\\AUMENTO\\${formData.nombreArchivoBin}`;
          if (await window.electronAPI.fileExists(aumentoFilePath)) attachments.push(aumentoFilePath);
        }
      } else {
        const binPath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;
        if (await window.electronAPI.fileExists(binPath)) attachments.push(binPath);
      }

      const resultado = await window.electronAPI.createOutlookDraft({
        subject,
        body,
        to: '',
        send: false,
        saveToSent: false,
        attachments
      });

      if (resultado.ok) {
        console.log(`✅ Correo creado en Outlook como borrador con ${attachments.length} adjunto(s)`);
        return subject;
      }
      console.error('❌ Error creando correo:', resultado.error);
      return '';
    } catch (error) {
      console.error('❌ Error creando correo:', error);
      return '';
    }
  };

  // Función para iniciar monitoreo de respuesta de correo
  const iniciarMonitoreoRespuesta = (asuntoCorreo: string): void => {
    if (!window.electronAPI) {
      console.warn('⚠️ Monitoreo solo disponible en Electron');
      return;
    }

    console.log('🔍 Iniciando monitoreo de respuesta...');
    
    // Verificar respuestas cada 5 minutos
    monitoringIntervalRef.current = setInterval(async () => {
      try {
        const resultado = await window.electronAPI.checkOutlookReplies({
          subjectKeyword: asuntoCorreo
        });

        if (resultado.ok && resultado.replies && resultado.replies.length > 0) {
          // Se encontraron respuestas
          console.log(`✅ ${resultado.count} respuesta(s) encontrada(s)`);
          
          // Analizar si hay aprobación
          const respuestaAprobada = resultado.replies.some((reply: any) => 
            reply.body.toLowerCase().includes('aprobado') || 
            reply.body.toLowerCase().includes('firmado') ||
            reply.body.toLowerCase().includes('ok')
          );

          if (respuestaAprobada) {
            // Detener monitoreo
            if (monitoringIntervalRef.current) {
              clearInterval(monitoringIntervalRef.current);
              monitoringIntervalRef.current = null;
            }
            
            // Notificar al usuario
            console.log('🎉 ¡Versión aprobada! Transicionando a certificación...');
            
            // TODO: Auto-transicionar a certificación
            alert('🎉 ¡Versión aprobada! La certificación se creará automáticamente.');
          }
        }
      } catch (error) {
        console.error('❌ Error verificando respuestas:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    console.log('✅ Monitoreo iniciado (verificando cada 5 minutos)');
  };

  // La detección de scripts/bin se ejecuta automáticamente cuando cambia la ruta del proyecto

  // Función para generar Release Notes
  const generarReleaseNotes = async (carpetaBase: string): Promise<void> => {
    try {
      if (!window.electronAPI) {
        console.warn('⚠️ Generación de Release Notes solo disponible en Electron');
        return;
      }

      const contenido = `# Release Notes - ${formData.cliente} ${formData.terminal}

## Versión ${formData.nombreVersionCliente}${formData.versionBase}_${formData.build}

**Fecha:** ${new Date().toLocaleDateString('es-CO')}  
**Responsable:** ${formData.responsable}  
**Departamento:** ${formData.departamento}

---

### 📝 Descripción
${formData.descripcionBreve}

### 🔧 Detalles Técnicos
- **Terminal:** ${formData.terminal}
- **Tipo de Firma:** ${formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Genérica'}
- **CID:** ${formData.cid || '0'}
- **Archivo Binario:** ${formData.nombreArchivoBin}

### 🔐 Checksums
- **BASE:** \`${formData.checksumBase}\`
- **AUMENTO:** \`${formData.checksumAumento}\`

### 📦 Paquetes
- **BASE:** ${formData.nombrePkgBase || 'N/A'} - \`${formData.checksumPkgBase || 'N/A'}\`

### 🗒️ Notas Técnicas
${formData.notasTecnicas || 'Sin notas adicionales'}

### 🔗 Links
${formData.linksOneDrive || 'N/A'}

---
*Generado automáticamente por Gestor de Versiones*
`;

      const rutaArchivo = `${carpetaBase}\\ReleaseNotes.md`;
      const resultado = await window.electronAPI.writeTextFile(rutaArchivo, contenido);

      if (resultado.ok) {
        console.log(`✅ Release Notes creado: ${rutaArchivo}`);
      } else {
        console.error(`❌ Error creando Release Notes: ${resultado.error}`);
      }
    } catch (error) {
      console.error('❌ Error generando Release Notes:', error);
    }
  };

  // Función para actualizar Roadmap
  const actualizarRoadmap = async (): Promise<void> => {
    try {
      if (!window.electronAPI) {
        console.warn('⚠️ Actualización de Roadmap solo disponible en Electron');
        return;
      }

      const basePath = resolveVersionesBasePath();
      if (!basePath) {
        console.warn('⚠️ No se pudo determinar la ruta del Roadmap. Configura "Ruta Local" para habilitar este paso.');
        return;
      }
      const roadmapPath = `${basePath}\\ROADMAP.md`;
      
      // Leer roadmap actual o crear nuevo
      const resultado = await window.electronAPI.readTextFile(roadmapPath);
      let contenidoActual = '';
      
      if (resultado.ok && resultado.content) {
        contenidoActual = resultado.content;
      } else {
        // Crear encabezado si no existe
        contenidoActual = `# Roadmap - Versiones\n\nHistorial de versiones entregadas y certificadas.\n\n---\n\n`;
      }

      // Agregar nueva entrada
      const nuevaEntrada = `
## ${formData.cliente} - ${formData.terminal}
**Versión:** ${formData.nombreVersionCliente}${formData.versionBase}_${formData.build}  
**Fecha:** ${new Date().toLocaleDateString('es-CO')}  
**Estado:** ${formData.tipoDocumento === 'firma' ? '🟡 Pendiente Firma' : '🟢 Certificado'}  
**Responsable:** ${formData.responsable}  
**Descripción:** ${formData.descripcionBreve}

---
`;

      const nuevoContenido = contenidoActual + nuevaEntrada;
      
      const escritura = await window.electronAPI.writeTextFile(roadmapPath, nuevoContenido);

      if (escritura.ok) {
        console.log(`✅ Roadmap actualizado: ${roadmapPath}`);
      } else {
        console.error(`❌ Error actualizando Roadmap: ${escritura.error}`);
      }
    } catch (error) {
      console.error('❌ Error actualizando Roadmap:', error);
    }
  };

  // Función para monitorear cambios en el archivo .bin
  const startFileMonitoring = () => {
    if (!formData.rutaCompilacion || !formData.nombreArchivoBin) return;
    
    const binFilePath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;

    if (checkFileIntervalRef.current) {
      clearInterval(checkFileIntervalRef.current);
      checkFileIntervalRef.current = null;
    }
    
    checkFileIntervalRef.current = setInterval(async () => {
      try {
        const md5Current = await window.electronAPI.computeMd5(binFilePath);
        if (md5Current && md5Current !== formData.checksumBase) {
          // El archivo cambió!
          setCompilationDetected(true);
          if (checkFileIntervalRef.current) {
            clearInterval(checkFileIntervalRef.current);
            checkFileIntervalRef.current = null;
          }
        }
      } catch (e) {
        // Archivo no existe aún o error leyendo
      }
    }, 3000); // Verificar cada 3 segundos
  };

  // Mantener rutaProyecto sincronizada si solo existe rutaCompilacion (compatibilidad con preferencias antiguas)
  useEffect(() => {
    if (!formData.rutaProyecto && formData.rutaCompilacion) {
      setFormData(prev => {
        if (prev.rutaProyecto) return prev;
        return { ...prev, rutaProyecto: prev.rutaCompilacion };
      });
    }
  }, [formData.rutaProyecto, formData.rutaCompilacion]);

  // Detectar script/bin automáticamente cuando cambia la ruta del proyecto
  useEffect(() => {
    const rutaProyecto = (formData.rutaProyecto || '').trim();
    const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;

    const clearPendingTimeout = () => {
      if (detectTargetsTimeoutRef.current) {
        clearTimeout(detectTargetsTimeoutRef.current);
        detectTargetsTimeoutRef.current = null;
      }
    };

    if (!rutaProyecto || !electronAPI || typeof electronAPI.findFiles !== 'function') {
      clearPendingTimeout();
      return;
    }

    clearPendingTimeout();

    let cancelled = false;

    detectTargetsTimeoutRef.current = setTimeout(async () => {
      if (cancelled) return;
      try {
        const compileResult = await electronAPI.findFiles(rutaProyecto, ['compile.py', 'Compile.py', 'compile.sh', 'Makefile', 'makefile']);
        const binResult = await electronAPI.findFiles(rutaProyecto, ['.bin']);

        if (cancelled) return;

        let detectedCommand = '';
        let detectedScriptDir = '';
        let detectedBinDir = '';
        let detectedBinName = '';

        if (compileResult?.ok && Array.isArray(compileResult.matches) && compileResult.matches.length > 0) {
          const found = compileResult.matches[0];
          const parts = found.split(/[/\\]/);
          const scriptName = parts.pop() || found;
          const scriptDir = parts.join('\\');

          if (/\.py$/i.test(scriptName)) {
            detectedCommand = `py ${scriptName}`;
          } else if (/makefile/i.test(scriptName)) {
            detectedCommand = 'make';
          } else if (/\.sh$/i.test(scriptName)) {
            detectedCommand = `bash ${scriptName}`;
          } else {
            detectedCommand = scriptName;
          }

          detectedScriptDir = scriptDir || rutaProyecto;
        }

        if (binResult?.ok && Array.isArray(binResult.matches) && binResult.matches.length > 0) {
          const tokenContext = buildBinTokenContext(
            formData.cliente,
            formData.terminal,
            formData.nombreVersionCliente,
            formData.versionBase,
            formData.versionAumento,
            formData.build,
            formData.nombreArchivoBin
          );

          const bestBin = selectBestBinCandidate(binResult.matches, {
            ...tokenContext,
            preferredDir: detectedScriptDir || formData.rutaCompilacion,
            projectRoot: rutaProyecto,
            currentBinName: formData.nombreArchivoBin
          });

          if (bestBin) {
            const parts = bestBin.path.split(/[\\/]/);
            const binName = parts.pop() || bestBin.path;
            const binDir = parts.join('\\');
            detectedBinName = binName;
            detectedBinDir = binDir;

            console.log(`🔎 Archivo .bin detectado automáticamente: ${bestBin.path}`);
            console.log(`   • Score: ${bestBin.score.toFixed(2)}`);
            if (bestBin.reasons?.length) {
              console.log(`   • Motivos: ${bestBin.reasons.join(' | ')}`);
            }
          }
        }

        if (detectedCommand || detectedBinDir || detectedBinName || (!formData.rutaCompilacion && detectedScriptDir)) {
          setFormData(prev => {
            const next = { ...prev };
            let changed = false;

            if (detectedCommand && next.comandoCompilacion !== detectedCommand) {
              next.comandoCompilacion = detectedCommand;
              changed = true;
            }

            if (detectedBinName && next.nombreArchivoBin !== detectedBinName) {
              next.nombreArchivoBin = detectedBinName;
              changed = true;
            }

            if (detectedBinDir && next.rutaCompilacion !== detectedBinDir) {
              next.rutaCompilacion = detectedBinDir;
              changed = true;
            } else if (!next.rutaCompilacion && detectedScriptDir) {
              next.rutaCompilacion = detectedScriptDir;
              changed = true;
            }

            return changed ? next : prev;
          });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error detectando compilación automática:', error);
      } finally {
        detectTargetsTimeoutRef.current = null;
      }
    }, 600);

    return () => {
      cancelled = true;
      clearPendingTimeout();
    };
  }, [formData.rutaProyecto]);

  // Limpiar intervalos al desmontar componente
  useEffect(() => {
    // Autocompletar build con fecha de hoy (YYMMDD) al abrir
    if (isOpen) {
      const today = getTodayYYMMDD();
      console.log('Fecha generada para build:', today);
      setFormData(prev => ({ ...prev, build: today }));
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (showTipoFirmaOptions && tipoFirmaRef.current && !tipoFirmaRef.current.contains(e.target as Node)) {
        setShowTipoFirmaOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      if (checkFileIntervalRef.current) {
        clearInterval(checkFileIntervalRef.current);
        checkFileIntervalRef.current = null;
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmittingRef.current) {
      console.log('⏸️ Ya hay un proceso en curso, ignorando submit');
      return;
    }

    const validationResult = validateForm(formData);

    if (!validationResult.isValid) {
      const missingLabels = validationResult.missingFields
        .map((field) => FIELD_LABELS[field] || field)
        .filter(Boolean);
      const formatLabels = validationResult.formatErrors
        .map((field) => FIELD_LABELS[field] || field)
        .filter(Boolean);

      const alertParts: string[] = [];
      if (missingLabels.length) {
        alertParts.push(`Completa: ${missingLabels.join(', ')}`);
      }
      if (formatLabels.length) {
        alertParts.push(`Revisa formato en: ${formatLabels.join(', ')}`);
      }
      setFormAlert(alertParts.join(' · ') || 'Revisa los campos obligatorios resaltados en rojo.');
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

      const focusTarget = validationResult.missingFields[0] || validationResult.formatErrors[0];
      if (focusTarget) {
        const input = fieldRefs.current[focusTarget as string];
        if (input) {
          setTimeout(() => input.focus(), 70);
        }
      }
      return;
    }

    setFormAlert(null);

    isSubmittingRef.current = true;

    try {
      // Solo para FIRMA: calcular checksums automáticamente
      if (formData.tipoDocumento === 'firma') {
        setIsCalculatingChecksums(true);
        setShowProgressModal(true);
        
        if (!formData.rutaCompilacion || !formData.nombreArchivoBin) {
          setErrorModal({ show: true, title: '❌ Faltan datos', message: 'Debes proporcionar la ruta de compilación y el nombre del archivo .bin' });
          setIsCalculatingChecksums(false);
          setShowProgressModal(false);
          isSubmittingRef.current = false;
          return;
        }

        const binFilePath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;
        let md5Base: string | null = null;

        // PASO 1: Calcular MD5 BASE
        setProgressStep('🔐 Calculando checksum BASE...');
        md5Base = await window.electronAPI.computeMd5(binFilePath);
        
        if (!md5Base) {
          setProgressStep('❌ Archivo BASE no encontrado');
          setTimeout(() => {
            setShowProgressModal(false);
            setIsCalculatingChecksums(false);
            isSubmittingRef.current = false;
            setErrorModal({ show: true, title: '❌ Archivo no encontrado', message: `No se encontró el archivo .bin en la ruta:\n\n${binFilePath}\n\nVerifica que hayas compilado la versión BASE correctamente.` });
          }, 2000);
          return;
        }
        
        console.log('✅ MD5 BASE:', md5Base);
        setFormData(prev => ({ ...prev, checksumBase: md5Base! }));
        await snapshotBaseBinary(binFilePath, md5Base);
        
        // Mostrar modal de confirmación para AUMENTO
        setProgressStep('✅ Checksum BASE registrado');
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setShowAumentoConfirm(true);
        isSubmittingRef.current = false;
        return;
      }

      // Para CERTIFICACIÓN: enviar directamente
      onSubmit(formData);
      handleClose();
      isSubmittingRef.current = false;

    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      setShowProgressModal(false);
      setIsCalculatingChecksums(false);
      isSubmittingRef.current = false;
      setErrorModal({ show: true, title: '❌ Error inesperado', message: 'Ocurrió un error al procesar la versión. Por favor intenta nuevamente.' });
    }
  };

  // Handlers para modal de confirmación AUMENTO
  const handleAumentoYes = async () => {
    setShowAumentoConfirm(false);
    
    // Verificar si tiene configuración para compilación automática
    const tieneCompilacionAuto = !!(formData.rutaProyecto && formData.archivoVersion && formData.comandoCompilacion);
    
    if (tieneCompilacionAuto) {
      // FLUJO AUTOMÁTICO: Actualizar .h → Compilar → Calcular MD5s → Crear correo
      await ejecutarFlujoAutomatico();
    } else {
      // FLUJO MANUAL: Esperar a que usuario compile
      setCompilationDetected(false);
      setWaitingForAumentoCompile(true);
      // Iniciar polling para detectar cambio en archivo
      startFileMonitoring();
    }
  };

  const ejecutarFlujoAutomatico = async () => {
    try {
      setShowProgressModal(true);
      setIsCalculatingChecksums(true);

      /**
       * Flujo automático completo de 10 pasos:
       * 1. Actualizar archivo .h con versión AUMENTO
       * 2. Compilar versión AUMENTO
       * 3. Calcular MD5 AUMENTO
       * 4. Validar BASE ≠ AUMENTO
       * 5. Crear estructura de carpetas OneDrive
       * 6. Capturar pantalla del ejecutable
       * 7. Generar Release Notes
       * 8. Actualizar Roadmap
       * 9. Crear correo en Outlook
       * 10. Iniciar monitoreo de respuesta
       */

      // Validar que campos mínimos estén presentes (archivo de versión puede auto-detectarse)
      if (!formData.rutaProyecto || !formData.comandoCompilacion || !formData.versionAumento) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({ 
          show: true, 
          title: '❌ Configuración incompleta', 
          message: 'Faltan campos de compilación automática:\n\n' +
                   `Ruta proyecto: ${formData.rutaProyecto || 'FALTA'}\n` +
                   `Archivo versión: ${formData.archivoVersion || 'AUTO (se buscará)'}\n` +
                   `Comando: ${formData.comandoCompilacion || 'FALTA'}\n` +
                   `Versión aumento: ${formData.versionAumento || 'FALTA'}` 
        });
        return;
      }

      const binFilePath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;
      let checksumBaseAuto = formData.checksumBase || '';
      let historialZipPath: string | null = null;
      const isCompilePy = /compile\.py/i.test(formData.comandoCompilacion || '');
      const stdinData = isCompilePy ? `${formData.compilePyMode || '2'}\n${formData.compilePyTarget || '2'}\n` : undefined;

      // PASO 1: Buscar archivo de versión automáticamente
      setProgressStep('🔍 Buscando archivo de versión...');
      const projectRoot = formData.rutaProyecto ? normalizeWindowsSlashes(formData.rutaProyecto) : '';
      const versionSearchBase = projectRoot || formData.rutaProyecto || '';
      let versionFilePath = '';
      let compilationDir = versionSearchBase;
      let originalVersionContent: string | null = null;
      const manualEntry = formData.archivoVersion?.trim();
      const manualVersionPath = resolveProjectFilePath(projectRoot, manualEntry);
      const headerHintPath = artifactHints.headerPath ? normalizeWindowsSlashes(artifactHints.headerPath) : null;

      // Intentar primero con la ruta especificada por el usuario
      if (manualEntry) {
        let manualCandidate = manualVersionPath;

        const candidateExists = manualCandidate ? await window.electronAPI.fileExists(manualCandidate) : false;
        if (!candidateExists) {
          manualCandidate = null;
        }

        if (!manualCandidate && versionSearchBase) {
          try {
            const manualSearch = await window.electronAPI.findFiles(versionSearchBase, [manualEntry]);
            const located = getFirstMatchPath(manualSearch);
            if (located) {
              manualCandidate = normalizeWindowsSlashes(located);
            }
          } catch (manualSearchError) {
            console.warn('No se pudo localizar el archivo indicado manualmente:', manualSearchError);
          }
        }

        if (!manualCandidate && headerHintPath) {
          manualCandidate = headerHintPath;
        }

        if (manualCandidate && await window.electronAPI.fileExists(manualCandidate)) {
          versionFilePath = manualCandidate;
          console.log('📄 Archivo de versión definido manualmente:', manualCandidate);
        } else if (manualVersionPath) {
          console.warn(`⚠️ No se encontró el archivo proporcionado (${manualVersionPath}). Se intentará con la detección automática.`);
        }
      }

      const versionSearchOptions = {
        hintFile: formData.archivoVersion || undefined,
        versionBase: formData.versionAumento || formData.versionBase || undefined,
        nombreVersionCliente: formData.nombreVersionCliente || undefined
      };

      if (!versionFilePath && versionSearchBase) {
        const found = await window.electronAPI.findVersionFile(versionSearchBase, versionSearchOptions);
        if (found?.ok && found.path) {
          versionFilePath = found.path;
          console.log('🔎 Archivo de versión detectado:', found.path, found.reason ? `(${found.reason})` : '');
        }
      }

      if (!versionFilePath || !(await window.electronAPI.fileExists(versionFilePath))) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({ 
          show: true, 
          title: '❌ Archivo no encontrado', 
          message: `No se encontró el archivo de versión.\n\nRuta del proyecto: ${versionSearchBase || '—'}\nArchivo indicado: ${manualEntry || '—'}\nSugerencia detectada: ${headerHintPath || '—'}\n\nEl sistema buscó archivos como appdef.h, version.h, etc., pero no encontró ninguno con definiciones #define VERSION.\n\nVerifica que el proyecto esté correcto.` 
        });
        return;
      }

      // PASO 2: Compilar la versión BASE nuevamente para garantizar binario fresco
      setProgressStep('🔁 Compilando versión BASE...');
      console.log('🔨 Recompilando BASE con comando:', formData.comandoCompilacion);
      const baseCompileResult = await window.electronAPI.runCompilation(
        formData.comandoCompilacion!,
        compilationDir,
        stdinData
      );

      if (!baseCompileResult.ok) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({
          show: true,
          title: 'Error compilando BASE',
          message: baseCompileResult.error || 'La compilación de la versión BASE falló. Revisa logs en la consola.'
        });
        return;
      }

      checksumBaseAuto = await window.electronAPI.computeMd5(binFilePath) || '';
      if (!checksumBaseAuto) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({ show: true, title: 'Checksum BASE inválido', message: 'No se pudo leer el binario recompilado para la versión BASE.' });
        return;
      }
      setFormData(prev => ({ ...prev, checksumBase: checksumBaseAuto }));
      await snapshotBaseBinary(binFilePath, checksumBaseAuto);

      // Guardar contenido original para restaurar tras compilar AUMENTO
      try {
        const readOriginal = await window.electronAPI.readTextFile(versionFilePath);
        if (readOriginal?.ok && readOriginal.content) {
          originalVersionContent = readOriginal.content;
        }
      } catch {}

      // PASO 3: Actualizar archivo .h con versión AUMENTO
      setProgressStep('📝 Actualizando versión AUMENTO en código...');
      console.log('📝 Editando archivo:', versionFilePath);
      const updateResult = await updateVersionInFile(versionFilePath, formData.versionAumento);
      
      if (!updateResult) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({ 
          show: true, 
          title: '❌ Error', 
          message: `No se pudo actualizar el archivo de versión.\n\nArchivo: ${versionFilePath}\n\nVerifica que:\n• Tengas permisos de escritura\n• El archivo no esté en uso\n• Contenga #define VERSION` 
        });
        return;
      }

      // PASO 3: Compilar versión AUMENTO
      setProgressStep('🔨 Compilando versión AUMENTO...');
      console.log('🔍 Comando de compilación:', formData.comandoCompilacion);
      console.log('🔍 Directorio de trabajo:', compilationDir);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa para mostrar mensaje
      
      const compileResult = await window.electronAPI.runCompilation(
        formData.comandoCompilacion!,
        compilationDir,
        stdinData
      );
      
      console.log('🔍 Resultado de compilación:', compileResult);
      
      if (!compileResult.ok) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({ 
          show: true, 
          title: 'Error de compilación', 
          message: `La compilación falló:\n\n${compileResult.error}\n\nRevisa el comando de compilación y los logs.` 
        });
        return;
      }

      // PASO 3: Calcular MD5 AUMENTO
      setProgressStep('🔐 Calculando checksum AUMENTO...');
      const md5Aumento = await window.electronAPI.computeMd5(binFilePath);
      
      if (!md5Aumento) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({ show: true, title: 'Error calculando MD5', message: 'No se pudo calcular el MD5 del archivo compilado.' });
        return;
      }

      // PASO 4: Validar que sean diferentes
      if (formData.checksumBase === md5Aumento) {
        setProgressStep('⚠️ Checksums idénticos');

        try {
          if (originalVersionContent) {
            const restore = await window.electronAPI.writeTextFile(versionFilePath, originalVersionContent);
            if (!restore?.ok && formData.versionBase) {
              await updateVersionInFile(versionFilePath, formData.versionBase);
            }
          } else if (formData.versionBase) {
            await updateVersionInFile(versionFilePath, formData.versionBase);
          }
        } catch (restoreError) {
          console.warn('No se pudo restaurar la versión BASE tras detectar checksums idénticos:', restoreError);
        }

        setTimeout(() => {
          setShowProgressModal(false);
          setIsCalculatingChecksums(false);
          setChecksumWarning(CHECKSUM_RECOMPILE_MESSAGE);
          setCompilationDetected(false);
          setWaitingForAumentoCompile(true);
          startFileMonitoring();
        }, 1200);
        return;
      }

      console.log('✅ MD5 AUMENTO:', md5Aumento);
      setFormData(prev => ({ ...prev, checksumAumento: md5Aumento }));

      setProgressStep('📦 Actualizando historial y ZIP...');
      const historialInfo = await registrarAumentoEnHistorial(checksumBaseAuto, md5Aumento);
      historialZipPath = historialInfo.zipPath || historialZipRef.current;

      // PASO 4.1: Restaurar versión BASE en el código (importante para el repositorio)
      setProgressStep('Restableciendo version BASE en el codigo...');
      try {
        if (originalVersionContent) {
          const restoreResult = await window.electronAPI.writeTextFile(versionFilePath, originalVersionContent);
          if (!restoreResult.ok) {
            console.warn('No se pudo restaurar el archivo a su estado original. Intentando fijar a version BASE...');
            // Fallback: fijar a la versión base usando el actualizador
            if (formData.versionBase) {
              await updateVersionInFile(versionFilePath, formData.versionBase);
            }
          } else {
            console.log('Archivo de versión restaurado al estado BASE (original)');
          }
        } else if (formData.versionBase) {
          await updateVersionInFile(versionFilePath, formData.versionBase);
        }
      } catch (e) {
        console.warn('Advertencia al restaurar la versión base:', e);
      }

      // PASO 5: Crear estructura de carpetas en OneDrive
      setProgressStep('📁 Creando estructura de carpetas...');
      const carpetaCreada = await crearEstructuraCarpetas(formData.checksumBase, md5Aumento);

      // PASO 6: Tomar captura de pantalla del ejecutable automáticamente
      setProgressStep('📸 Capturando pantalla automáticamente...');
      if (carpetaCreada) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await capturarPantalla(carpetaCreada);
      }

      // PASO 7: Generar Release Notes
      setProgressStep('📄 Generando Release Notes...');
      if (carpetaCreada) {
        await generarReleaseNotes(carpetaCreada);
      }

      // PASO 8: Actualizar Roadmap
      setProgressStep('🗺️ Actualizando Roadmap...');
      await actualizarRoadmap();

      // PASO 9: Crear correo en Outlook con adjuntos
      setProgressStep('📧 Generando correo en Outlook...');
      await new Promise(resolve => setTimeout(resolve, 800));
      const asuntoCorreo = await crearCorreoOutlook(md5Aumento, carpetaCreada, historialZipPath || undefined);
      if (asuntoCorreo) {
        await new Promise(resolve => setTimeout(resolve, 1800));
      }

      setProgressStep('✅ Proceso completado - Correo creado');
      setIsCalculatingChecksums(false);
      setShowProgressModal(false);
      
      // Guardar versión
      const dataFinal: CrearVersionData = {
        ...formData,
        checksumAumento: md5Aumento
      };
      onSubmit(dataFinal);
      
      // Iniciar monitoreo de respuesta
      if (asuntoCorreo) {
        iniciarMonitoreoRespuesta(asuntoCorreo);
      }
      
      handleClose();

    } catch (error) {
      console.error('❌ Error en flujo automático:', error);
      setShowProgressModal(false);
      setIsCalculatingChecksums(false);
      setErrorModal({ show: true, title: '❌ Error inesperado', message: `Ocurrió un error: ${error}` });
    }
  };

  const handleAumentoNo = async () => {
    setShowAumentoConfirm(false);
    
    // Crear versión solo con BASE
    const dataParaGuardar: CrearVersionData = {
      ...formData,
      // Limpiar campos de AUMENTO
      versionAumento: undefined,
      checksumAumento: undefined
    };
    
    // Intentar crear correo aun si es solo BASE (mostrar indicador de generación)
    try {
      setShowProgressModal(true);
      setProgressStep('📦 Actualizando historial y ZIP...');
      const historialInfo = await registrarAumentoEnHistorial(formData.checksumBase);
      setProgressStep('📧 Generando correo en Outlook...');
      await new Promise(resolve => setTimeout(resolve, 600));
      const carpeta = await crearEstructuraCarpetas(formData.checksumBase);
      const asunto = await crearCorreoOutlook('', carpeta, historialInfo.zipPath || undefined);
      if (asunto) {
        await new Promise(resolve => setTimeout(resolve, 1800));
      }
    } catch (e) {
      console.warn('No fue posible crear correo automáticamente:', e);
    } finally {
      setShowProgressModal(false);
    }

    onSubmit(dataParaGuardar);
    handleClose();
  };

  const handleAumentoDone = async () => {
    setWaitingForAumentoCompile(false);
    
    if (!formData.rutaCompilacion || !formData.nombreArchivoBin) {
      setErrorModal({ show: true, title: '❌ Faltan datos', message: 'Debes proporcionar la ruta de compilación y el nombre del archivo .bin' });
      return;
    }

    setShowProgressModal(true);
    setProgressStep('🔐 Calculando checksum AUMENTO...');
    setIsCalculatingChecksums(true);
    
    const binFilePath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;
    const md5Aumento = await window.electronAPI.computeMd5(binFilePath);
    
    if (!md5Aumento) {
      setShowProgressModal(false);
      setIsCalculatingChecksums(false);
      setErrorModal({ show: true, title: 'Error calculando checksum', message: 'No se pudo calcular el MD5 del archivo AUMENTO. Verifica que el archivo existe en la ruta de compilación.' });
      return;
    }

      // Validar que los checksums sean diferentes
      if (formData.checksumBase === md5Aumento) {
        console.log('⚠️ Checksums idénticos detectados');
        console.log('BASE:', formData.checksumBase);
        console.log('AUMENTO:', md5Aumento);
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setChecksumWarning(CHECKSUM_RECOMPILE_MESSAGE);
        setCompilationDetected(false);
        startFileMonitoring();
        setWaitingForAumentoCompile(true);
        return;
      }
      setChecksumWarning('');
    console.log('✅ MD5 AUMENTO:', md5Aumento);
    setFormData(prev => ({ ...prev, checksumAumento: md5Aumento }));
    setProgressStep('📦 Actualizando historial y ZIP...');
    const historialInfo = await registrarAumentoEnHistorial(formData.checksumBase, md5Aumento);
    
    // Crear estructura de carpetas
    setProgressStep('📁 Creando estructura de carpetas...');
    const carpetaCreada = await crearEstructuraCarpetas(formData.checksumBase, md5Aumento);
    
    // Crear correo con adjuntos
    setProgressStep('📧 Generando correo en Outlook...');
    await new Promise(resolve => setTimeout(resolve, 800));
    const asuntoCorreo = await crearCorreoOutlook(md5Aumento, carpetaCreada, historialInfo.zipPath || undefined);
    if (asuntoCorreo) {
      await new Promise(resolve => setTimeout(resolve, 1800));
    }
    
    setProgressStep('✅ Proceso completado');
    setIsCalculatingChecksums(false);
    setShowProgressModal(false);
    
    // Guardar versión
    const dataFinal: CrearVersionData = {
      ...formData,
      checksumAumento: md5Aumento
    };
    onSubmit(dataFinal);
    
    // Iniciar monitoreo
    if (asuntoCorreo) {
      iniciarMonitoreoRespuesta(asuntoCorreo);
    }
    
    handleClose();
  };

  const handleClose = () => {
    const preferences = loadPreferences();
    setFormData({
      ...initialFormData,
      ...preferences
    });
    historialFolderRef.current = null;
    historialZipRef.current = null;
    setLastHistorialPath(null);
    setLastHistorialZip(null);
    setCopiedHistorial(null);
    clearErrors();
    setShowMetadata(false);
    setFormAlert(null);
    setArtifactHints({ binPath: null, headerPath: null, isSearching: false });
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-full h-full bg-gray-900 z-[100]"
            style={{ margin: 0, padding: 0 }}
            transition={{ duration: 0.2 }}
          />
          <div className="fixed top-0 left-0 w-full h-full z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl flex flex-col overflow-hidden border-2 border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
                <motion.div 
                  className="relative px-6 sm:px-8 py-5 sm:py-6 border-b-2 border-gray-200 dark:border-gray-700 bg-pink-50 dark:bg-gray-800"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                        className="flex-shrink-0"
                      >
                        <DocumentTextIcon className="h-9 w-9 sm:h-10 sm:w-10 text-pink-600 dark:text-pink-400" />
                      </motion.div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 dark:text-white">
                          Crear Nueva Versión
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-1">
                          Firma o Certificación de versión
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isCalculatingChecksums || showProgressModal || waitingForAumentoCompile}
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        (isCalculatingChecksums || showProgressModal || waitingForAumentoCompile)
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                      title={(isCalculatingChecksums || showProgressModal || waitingForAumentoCompile) ? "Debes completar el proceso antes de cerrar" : "Cerrar"}
                    >
                      <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </motion.div>

                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900" ref={scrollContainerRef}>
                  <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 sm:py-6 space-y-4">
                    {formAlert && (
                      <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50/90 dark:bg-red-900/30 p-4 flex gap-3 items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-700 dark:text-red-200">{formAlert}</p>
                          <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-1">Corrige estos campos y vuelve a intentar crear la versión.</p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      <label className="block font-body text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Tipo de Documento <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.button
                          type="button"
                          onClick={() => handleInputChange('tipoDocumento', 'firma')}
                          whileHover={{ }}
                          whileTap={{ }}
                          className={cn(
                            'relative p-5 rounded-2xl border-2 transition-all font-body font-semibold',
                            formData.tipoDocumento === 'firma'
                              ? 'border-pink-500 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                              : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 bg-white dark:bg-gray-800'
                          )}
                        >
                          <div className="relative flex items-center justify-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-base">FIRMA</span>
                          </div>
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={() => handleInputChange('tipoDocumento', 'certificacion')}
                          whileHover={{ }}
                          whileTap={{ }}
                          className={cn(
                            'relative p-5 rounded-2xl border-2 transition-all font-body font-semibold',
                            formData.tipoDocumento === 'certificacion'
                              ? 'border-purple-500 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                          )}
                        >
                          <div className="relative flex items-center justify-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-base">CERTIFICACIÓN</span>
                          </div>
                        </motion.button>
                      </div>
                    </div>
                    <FormSection
                      title="Información del Cliente y Versión"
                      description="Estos campos son comunes para FIRMA y CERTIFICACIÓN"
                      borderColor="border-pink-200 dark:border-pink-800"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <TextField
                          label="Cliente"
                          value={formData.cliente || ''}
                          onChange={(val) => handleInputChange('cliente', val)}
                          onEnter={() => focusNextField('cliente')}
                          inputRef={(el) => fieldRefs.current.cliente = el}
                          error={errors.cliente}
                          required
                          placeholder="Ej: Banco XYZ"
                        />

                        <TextField
                          label="Nombre Versión Cliente (ENLACEAV)"
                          value={formData.nombreVersionCliente || ''}
                          onChange={(val) => handleInputChange('nombreVersionCliente', val)}
                          onEnter={() => focusNextField('nombreVersionCliente')}
                          inputRef={(el) => fieldRefs.current.nombreVersionCliente = el}
                          error={errors.nombreVersionCliente}
                          required
                          placeholder="Ej: ENLACEAV"
                        />

                        <TextField
                          label="Terminal"
                          value={formData.terminal || ''}
                          onChange={(val) => handleInputChange('terminal', val)}
                          onEnter={() => focusNextField('terminal')}
                          inputRef={(el) => fieldRefs.current.terminal = el}
                          error={errors.terminal}
                          required
                          placeholder="Ej: VX820"
                        />

                        <TextField
                          label="Versión Base"
                          value={formData.versionBase || ''}
                          onChange={(val) => handleInputChange('versionBase', val)}
                          onEnter={() => focusNextField('versionBase')}
                          inputRef={(el) => fieldRefs.current.versionBase = el}
                          error={errors.versionBase}
                          required
                          placeholder="Ej: 1.0.0"
                          helper="Formato: X.Y.Z"
                        />

                        <div className="md:col-span-2 mb-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">¿Incluir versión AUMENTO?</span>
                          <button
                            type="button"
                            onClick={toggleIncludeAumento}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
                              includeAumentoCert ? 'bg-green-500 text-white shadow-md' : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                            )}
                          >
                            {includeAumentoCert ? '✓ Sí' : '✗ No'}
                          </button>
                          <span className="text-xs text-gray-600 dark:text-gray-400 ml-auto">La versión de aumento es opcional en algunos casos</span>
                        </div>

                        {includeAumentoCert && (
                          <TextField
                            label="Versión Aumento"
                            value={formData.versionAumento || ''}
                            onChange={(val) => handleInputChange('versionAumento', val)}
                            onEnter={() => focusNextField('versionAumento')}
                            inputRef={(el) => fieldRefs.current.versionAumento = el}
                            error={errors.versionAumento}
                            required={formData.tipoDocumento === 'firma' && includeAumentoCert}
                            placeholder="Ej: 1.1.0"
                            helper="Formato: X.Y.Z"
                          />
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-5">
                        {/* Tipo de Firma */}
                        <div className="flex flex-col">
                          <label className="block font-display text-sm font-bold text-gray-800 dark:text-white mb-2">
                            🔐 Tipo de Firma
                          </label>
                          <div ref={tipoFirmaRef} className="relative group flex-1 mt-1" onKeyDown={(e) => { if (e.key === 'Escape') setShowTipoFirmaOptions(false); }}>
                            <button
                              type="button"
                              aria-haspopup="listbox"
                              aria-expanded={showTipoFirmaOptions}
                              onClick={() => setShowTipoFirmaOptions(v => !v)}
                              className="w-full text-left px-5 py-3 pr-14 rounded-xl border-2 border-gray-300 dark:border-gray-600
                                         bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900
                                         text-gray-900 dark:text-white font-display font-semibold shadow-md
                                         hover:border-pink-400 dark:hover:border-pink-500
                                         hover:shadow-xl hover:shadow-pink-500/20
                                         focus:border-pink-500 dark:focus:border-pink-400
                                         focus:ring-4 focus:ring-pink-500/20 focus:shadow-2xl focus:shadow-pink-500/30
                                         transition-all duration-200 cursor-pointer"
                            >
                              {formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Genérica'}
                            </button>

                            {/* Chevron */}
                            <motion.div
                              animate={{ rotate: showTipoFirmaOptions ? 180 : 0 }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                            >
                              <ChevronDownIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                            </motion.div>

                            {/* Custom dropdown list */}
                            <AnimatePresence>
                              {showTipoFirmaOptions && (
                                <motion.ul
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  role="listbox"
                                  className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border-2 border-pink-200 dark:border-pink-700
                                             bg-gradient-to-b from-white via-pink-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
                                             shadow-2xl shadow-pink-500/20"
                                >
                                  {[
                                    { value: 'generica', label: 'Genérica', icon: '🌐' },
                                    { value: 'personalizada', label: 'Personalizada', icon: '👤' },
                                  ].map(opt => (
                                    <li key={opt.value} role="option" aria-selected={(formData.tipoFirma || 'generica') === (opt.value as any)}>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { handleInputChange('tipoFirma', opt.value as any); setShowTipoFirmaOptions(false); }}
                                        className={cn(
                                          'w-full text-left px-4 py-2.5 transition-colors flex items-center gap-2',
                                          (formData.tipoFirma || 'generica') === opt.value ?
                                            'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 font-semibold' :
                                            'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/70 text-gray-800 dark:text-gray-200'
                                        )}
                                      >
                                        <span className="text-lg">{opt.icon}</span>
                                        <span>{opt.label}</span>
                                      </button>
                                    </li>
                                  ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* CID (Customer ID) */}
                        <div className="flex flex-col">
                          <label className="block font-display text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                              ID
                            </span>
                            CID (Customer ID)
                          </label>
                          
                          <div className="relative flex-1 flex items-center">
                            {formData.tipoFirma === 'generica' ? (
                              <div className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-display text-gray-600 dark:text-gray-300 font-bold text-lg">
                                0
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={formData.cid || ''}
                                onChange={(e) => handleInputChange('cid', e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 
                                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-display font-bold 
                                          focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 
                                          transition-all hover:border-indigo-400 dark:hover:border-indigo-500"
                              />
                            )}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400 font-bold text-lg">
                              #
                            </div>
                          </div>
                        </div>
                      </div>

                      <TextAreaField
                        label="Descripción Breve"
                        value={formData.descripcionBreve || ''}
                        onChange={(val) => handleInputChange('descripcionBreve', val)}
                        error={errors.descripcionBreve}
                        required
                        placeholder="Describe brevemente los cambios de esta versión..."
                        rows={3}
                      />

                      {formData.tipoDocumento === 'firma' && (
                        <>
                          <PathField
                            label="📂 Ruta del Proyecto"
                            value={formData.rutaProyecto || formData.rutaCompilacion || ''}
                            onChange={handleRutaProyectoChange}
                            error={errors.rutaCompilacion}
                            required
                            placeholder="Ej: C:\\builds\\proyecto\\v1.0.0"
                            helper="Selecciona la carpeta raíz de tu proyecto para que la app busque scripts y binarios"
                          />

                          {!supportsProjectLookup && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-body">
                              La detección automática solo está disponible en la app de escritorio.
                            </p>
                          )}

                          <div className="mt-6">
                            <TextField
                              label="Nombre del Archivo .bin"
                              value={formData.nombreArchivoBin || ''}
                              onChange={(val) => handleInputChange('nombreArchivoBin', val)}
                              error={errors.nombreArchivoBin}
                              required
                              placeholder="Ej: ATC.bin"
                              helper="Nombre del archivo compilado"
                            />
                          </div>
                          {shouldShowBinHint && (
                            <p
                              className={cn(
                                'text-xs font-body mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300',
                                artifactHints.isSearching && 'text-gray-500'
                              )}
                            >
                              {artifactHints.isSearching
                                ? 'Buscando el archivo dentro del proyecto...'
                                : `Archivo detectado en ${artifactHints.binPath}`}
                            </p>
                          )}
                        </>
                      )}

                      {/* Sección opcional para compilación automática */}
                      {formData.tipoDocumento === 'firma' && (
                        <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                          <button
                            type="button"
                            onClick={() => setShowCompilacionAuto(v => !v)}
                            className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                          >
                            <h4 className="font-display font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                              <span>🤖</span>
                              Compilación Automática (Opcional)
                            </h4>
                            <motion.svg
                              animate={{ rotate: showCompilacionAuto ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                              className="h-5 w-5 text-blue-600 dark:text-blue-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </motion.svg>
                          </button>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                            Completa estos campos para que el sistema actualice el código y compile automáticamente la versión AUMENTO. Si los dejas vacíos, tendrás que compilar manualmente o se generará solo la versión base.
                          </p>
                          
                          <AnimatePresence>
                            {showCompilacionAuto && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="mt-4">
                                    <TextField
                                      label="Archivo de Versión (.h)"
                                      value={formData.archivoVersion || ''}
                                      onChange={(val) => handleInputChange('archivoVersion', val)}
                                      placeholder="src/version.h"
                                      helper="Archivo donde actualizas la versión. Puede ser cualquier .h: buscamos dinámicamente #define VER/VERSION o coincidencias con tu cliente/versión."
                                    />
                                  </div>
                                  {shouldShowHeaderHint && (
                                    <p
                                      className={cn(
                                        'text-xs font-body mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300',
                                        artifactHints.isSearching && 'text-gray-500'
                                      )}
                                    >
                                      {artifactHints.isSearching
                                        ? 'Buscando el archivo dentro del proyecto...'
                                        : `Archivo detectado en ${artifactHints.headerPath}`}
                                    </p>
                                  )}
                                  
                                  <div className="space-y-2">
                                    <TextField
                                      label="Comando de Compilación"
                                      value={formData.comandoCompilacion || ''}
                                      onChange={(val) => handleInputChange('comandoCompilacion', val)}
                                      placeholder="py compile.py o make clean; make app-Basic"
                                      helper="El comando que usas normalmente para compilar"
                                    />
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                      <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-2">💡 Ejemplos de comandos:</p>
                                      <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4">
                                        <li><strong>Python:</strong> <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">py compile.py</code></li>
                                        <li><strong>Make (WSL/Ubuntu):</strong> <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">make clean; make app-Basic</code></li>
                                        <li><strong>Make directo:</strong> <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">wsl make all</code></li>
                                      </ul>
                                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                        ⚠️ <strong>Nota:</strong> En Windows, comandos Make se ejecutan automáticamente en WSL (Ubuntu/Linux)
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </FormSection>
                    {hasHistorialInfo && (
                      <FormSection
                        title="Historial y ZIP generados"
                        description="Se crean automáticamente en OneDrive para conservar BASE y AUMENTO"
                        borderColor="border-blue-200 dark:border-blue-700"
                      >
                        <div className="space-y-4">
                          {lastHistorialPath && (
                            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-900/10">
                              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Carpeta del historial</p>
                              <p className="mt-1 text-xs font-mono break-all text-blue-800 dark:text-blue-100">{lastHistorialPath}</p>
                              <div className="mt-3 flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleCopyHistorialPath(lastHistorialPath, 'folder')}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                  {copiedHistorial === 'folder' ? 'Copiado ✓' : 'Copiar ruta'}
                                </button>
                              </div>
                            </div>
                          )}
                          {lastHistorialZip && (
                            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/10">
                              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">ZIP listo para adjuntar</p>
                              <p className="mt-1 text-xs font-mono break-all text-indigo-800 dark:text-indigo-100">{lastHistorialZip}</p>
                              <div className="mt-3 flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleCopyHistorialPath(lastHistorialZip, 'zip')}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                >
                                  {copiedHistorial === 'zip' ? 'Copiado ✓' : 'Copiar ruta'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormSection>
                    )}
                    {formData.tipoDocumento === 'certificacion' && (
                      <FormSection
                        title="Campos Exclusivos de Certificación"
                        description="Estos campos solo aplican para el proceso de CERTIFICACIÓN"
                        borderColor="border-purple-200 dark:border-purple-800"
                      >
                        <div className="mb-6 flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">¿Incluir versión AUMENTO en certificación?</span>
                          <button
                            type="button"
                            onClick={toggleIncludeAumento}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
                              includeAumentoCert ? 'bg-green-500 text-white shadow-md' : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                            )}
                          >
                            {includeAumentoCert ? '✓ Sí' : '✗ No'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                          <TextField
                            label="Nombre del .pkg BASE"
                            value={formData.nombrePkgBase || ''}
                            onChange={(val) => handleInputChange('nombrePkgBase', val)}
                            error={errors.nombrePkgBase}
                            required
                            placeholder="Ej: app_base_v1.0.0.pkg"
                          />

                          <TextField
                            label="Checksum del .pkg BASE"
                            value={formData.checksumPkgBase || ''}
                            onChange={(val) => handleInputChange('checksumPkgBase', val)}
                            error={errors.checksumPkgBase}
                            required
                            placeholder="Ej: a3b5c7d9..."
                          />

                          {includeAumentoCert && (
                            <>
                              <TextField
                                label="Nombre del .pkg AUMENTO"
                                value={formData.nombrePkgAumento || ''}
                                onChange={(val) => handleInputChange('nombrePkgAumento', val)}
                                placeholder="Ej: app_aumento_v1.1.0.pkg"
                              />

                              <TextField
                                label="Checksum del .pkg AUMENTO"
                                value={formData.checksumPkgAumento || ''}
                                onChange={(val) => handleInputChange('checksumPkgAumento', val)}
                                placeholder="Ej: b4c6d8e0..."
                              />
                            </>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                          <div className="space-y-2">
                            <TextAreaField
                              label="Links de OneDrive"
                              value={formData.linksOneDrive || ''}
                              onChange={(val) => handleInputChange('linksOneDrive', val)}
                              error={errors.linksOneDrive}
                              required
                              placeholder="Pega los links de OneDrive aquí..."
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <PathField
                              label="Ruta Local de Escritorio"
                              value={formData.rutaLocal || ''}
                              onChange={(path) => handleInputChange('rutaLocal', path)}
                              placeholder="C:\Users\Desktop\MiCarpeta"
                              helper="Selecciona la carpeta del escritorio con el botón 📁"
                            />
                          </div>
                        </div>

                        <FileField
                          label="Captura de Evidencia"
                          onChange={(file) => handleInputChange('capturaEvidencia', file)}
                          accept="image/*,.pdf"
                          helper="Imagen o PDF de evidencia"
                        />
                      </FormSection>
                    )}

                    <motion.div 
                      className="pt-4 border-t border-gray-200 dark:border-gray-700"
                      initial={false}
                    >
                      <motion.button
                        type="button"
                        onClick={() => setShowMetadata(!showMetadata)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <span className="font-body font-semibold text-gray-700 dark:text-gray-300">
                          Metadatos Opcionales
                        </span>
                        <motion.svg
                          animate={{ rotate: showMetadata ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="h-5 w-5 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </motion.button>

                      <AnimatePresence>
                        {showMetadata && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextField
                                  label="Responsable"
                                  value={formData.responsable || ''}
                                  onChange={(val) => handleInputChange('responsable', val)}
                                  placeholder="Nombre del responsable"
                                />
                              </div>

                              <TextAreaField
                                label="Notas Técnicas"
                                value={formData.notasTecnicas || ''}
                                onChange={(val) => handleInputChange('notasTecnicas', val)}
                                placeholder="Notas adicionales para el equipo técnico..."
                                rows={3}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                  </form>
                </div>
                <div className="sticky bottom-0 px-6 sm:px-8 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex gap-3 justify-end items-center">
                      <motion.button
                        type="button"
                        onClick={handleClose}
                        whileHover={{ }}
                        whileTap={{ }}
                        className="px-6 py-2.5 rounded-xl font-body font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isCalculatingChecksums || showProgressModal}
                        className={cn(
                          "relative px-6 py-2.5 rounded-xl font-body font-semibold transition-all flex items-center gap-2 min-w-[180px] justify-center",
                          (isCalculatingChecksums || showProgressModal)
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-pink-600 text-white hover:bg-pink-700"
                        )}
                      >
                        <span className={cn("absolute left-4", (isCalculatingChecksums || showProgressModal) ? "inline-block animate-spin" : "hidden")} aria-hidden>⏳</span>
                        <span className="text-center">
                          {(isCalculatingChecksums || showProgressModal) 
                            ? 'Procesando...' 
                            : formData.tipoDocumento === 'certificacion' 
                              ? 'Certificar' 
                              : 'Crear Versión'}
                        </span>
                      </button>
                  </div>
                </div>
            </motion.div>
          </div>

          {/* Modal de confirmación AUMENTO */}
          {showAumentoConfirm && (
            <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-[110]">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl text-white">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Checksum BASE Calculado</h3>
                </div>
                <div className="bg-white/80 rounded-xl p-4 mb-6 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-700 text-sm leading-relaxed flex-1">
                      <span className="font-semibold text-green-600">MD5 BASE:</span>{' '}
                      <span className="font-mono text-xs break-all select-all">
                        {formData.checksumBase && formData.checksumBase.length > 0 ? formData.checksumBase : '—'}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const val = formData.checksumBase || '';
                        if (!val) return;
                        if (navigator?.clipboard?.writeText) {
                          navigator.clipboard.writeText(val);
                        }
                      }}
                      className="px-2 py-1 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                      title="Copiar MD5"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-6 text-center font-medium leading-relaxed">
                  ¿Deseas crear la versión AUMENTO ahora?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleAumentoNo}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Solo BASE
                  </button>
                  <button
                    onClick={handleAumentoYes}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Sí, continuar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de espera para compilación AUMENTO */}
          {waitingForAumentoCompile && (
            <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-[110]">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 max-w-lg mx-4 shadow-2xl border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-2xl">🔨</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Compila la Versión AUMENTO</h3>
                </div>
                
                {checksumWarning && (
                  <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-600 text-xl">⚠️</span>
                      <p className="font-semibold text-red-800">Checksums Idénticos</p>
                    </div>
                    <p className="text-sm text-red-700 leading-relaxed">
                      {checksumWarning}
                    </p>
                  </div>
                )}
                
                <div className="border-2 border-blue-200 rounded-xl p-4 mb-6 bg-blue-50/50">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Versión AUMENTO:</p>
                  <p className="text-xl font-bold text-blue-700 tracking-wide">{formData.versionAumento}</p>
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-600 text-xl">⚠️</span>
                    <p className="font-semibold text-yellow-800">Acción requerida:</p>
                  </div>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    Compila el proyecto ahora (en tu IDE, VM, o WSL). Cuando el archivo <span className="font-mono font-semibold">.bin</span> esté generado, presiona <strong>"Finalizar"</strong>.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleAumentoDone}
                    disabled={!compilationDetected}
                    className={cn(
                      "flex-1 px-6 py-3 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2",
                      compilationDetected
                        ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {compilationDetected ? (
                      <>
                        <span>✓</span>
                        <span>Finalizar</span>
                      </>
                    ) : (
                      <>
                        <span className="animate-pulse">⏳</span>
                        <span>Esperando compilación...</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de progreso */}
          {showProgressModal && (
            <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-[110]">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-100">
                <div className="flex flex-col items-center gap-5">
                  {progressDisplay.status === 'loading' && (
                    <div className="w-16 h-16 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" aria-label="procesando" />
                  )}

                  {progressDisplay.status === 'success' && (
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-bold">
                      ✓
                    </div>
                  )}

                  {progressDisplay.status === 'error' && (
                    <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl font-bold">
                      ✕
                    </div>
                  )}

                  <p className="text-lg font-semibold text-gray-900 text-center leading-relaxed">
                    {progressDisplay.text || 'Procesando...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal de error personalizado */}
          {errorModal.show && (
            <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-[120] p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-red-200/70 dark:border-red-500/60 shadow-2xl p-6">
                <div className="flex flex-col gap-5 text-left w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-3xl">⚠️</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                      {errorModal.title}
                    </h3>
                  </div>

                  {parsedErrorMessage.paragraphs.length > 0 ? (
                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
                      {parsedErrorMessage.paragraphs.map((paragraph, idx) => (
                        <p key={idx} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line break-words">
                      {errorModal.message}
                    </p>
                  )}

                  {parsedErrorMessage.filePath && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Archivo detectado</p>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800/40 border border-gray-200/70 dark:border-gray-700 p-3 font-mono text-xs text-gray-800 dark:text-gray-100 break-all">
                          {parsedErrorMessage.filePath}
                        </div>
                        <button
                          onClick={() => handleCopyErrorPath(parsedErrorMessage.filePath)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 transition hover:opacity-90"
                        >
                          {copiedErrorPath ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {parsedErrorMessage.bulletItems.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-200">
                      {parsedErrorMessage.bulletItems.map((item, idx) => (
                        <li key={idx} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => setErrorModal({ show: false, title: '', message: '' })}
                    className="w-full px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:opacity-90 transition"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}