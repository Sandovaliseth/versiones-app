import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DocumentTextIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { CrearVersionData, initialFormData } from './types';
import { useVersionValidation } from './useVersionValidation';
import { FieldGroup, FormSection, TextField, TextAreaField, FileField, PathField } from './FormComponents';
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

const resolveCompilationCwd = (
  command: string | undefined,
  rutaProyecto: string | undefined,
  rutaCompilacion: string | undefined
): string => {
  const cmd = (command || '').trim().toLowerCase();
  const projectRoot = normalizeWindowsSlashes((rutaProyecto || '').trim()).replace(/[\\/]+$/, '');
  const buildDir = normalizeWindowsSlashes((rutaCompilacion || '').trim()).replace(/[\\/]+$/, '');

  if (cmd.includes('compile.py') || (cmd.includes('.py') && (cmd.includes('py ') || cmd.includes('python ')))) {
    return projectRoot || buildDir;
  }

  return buildDir || projectRoot;
};

const sanitizePathSegment = (value?: string, preserveDots: boolean = false) => {
  if (!value) return '';
  if (preserveDots) {
    return value
      .normalize('NFD')
      .replace(/[^\w\d.\-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80);
  }
  return value
    .normalize('NFD')
    .replace(/[^\w\d-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
};

const buildHistorialFolderName = (data: CrearVersionData) => {
  const client = data.nombreVersionCliente || data.cliente || 'VERSION';
  const build = data.build || getTodayYYMMDD();
  if (data.esDemo) {
    const label = `DEMO_${client}_${build}`;
    return sanitizePathSegment(label, true);
  }
  const baseVersion = data.versionBase || 'BASE';
  const label = `${client}${baseVersion}_${build}`;
  return sanitizePathSegment(label, true);
};

const buildBinFolderName = (label?: string, version?: string) => {
  const base = version || '';
  return sanitizePathSegment(`${label || ''}${base}`, true) || 'BASE';
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

  const [waitingForAumentoCompile, setWaitingForAumentoCompile] = useState(false);
  const [waitingForBaseCompile, setWaitingForBaseCompile] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; title: string; message: string }>({ show: false, title: '', message: '' });
  const [compilationDetected, setCompilationDetected] = useState(false);
  const compilationDetectedRef = useRef(false);
  const [showTipoFirmaOptions, setShowTipoFirmaOptions] = useState(false);
  const tipoFirmaRef = useRef<HTMLDivElement | null>(null);
  const [showCompilacionAuto, setShowCompilacionAuto] = useState(false);
  const [checksumWarning, setChecksumWarning] = useState<string>('');
  const [copiedErrorPath, setCopiedErrorPath] = useState(false);
  const [lastHistorialPath, setLastHistorialPath] = useState<string | null>(null);
  const [lastHistorialZip, setLastHistorialZip] = useState<string | null>(null);
  const [copiedHistorial, setCopiedHistorial] = useState<'folder' | 'zip' | null>(null);
  const userClearedCommandRef = useRef<boolean>(false);
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
  const lastMonitoredMd5Ref = useRef<string | null>(null);
  const baseChecksumRef = useRef<string | null>(null);
  const lastMonitoredMtimeRef = useRef<number | null>(null);
  const lastMonitoredSizeRef = useRef<number | null>(null);
  const fileMissingAtStartRef = useRef<boolean>(false);
  const checksumErrorShownRef = useRef<boolean>(false);
  const hasDetectedAnyChangeRef = useRef<boolean>(false);
  const cachedVersionFileRef = useRef<string | null>(null);
  const cachedProjectRootRef = useRef<string | null>(null);

  useEffect(() => {
    compilationDetectedRef.current = compilationDetected;
  }, [compilationDetected]);
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

  const showChecksumIdenticalError = () => {
    if (checksumErrorShownRef.current) return;
    setChecksumWarning('Los checksums son idénticos. Realice un "clean" y compile nuevamente.');
    checksumErrorShownRef.current = true;
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


  const ensureHistorialFolder = async (): Promise<string | null> => {
    if (!window.electronAPI) return null;

    let basePath = (formData.rutaLocal || '').trim();
    if (!basePath) {
      try {
        basePath = await window.electronAPI.getDefaultVersionesPath();
      } catch (e) {
        console.warn('⚠️ No fue posible obtener ruta por defecto de Versiones:', e);
        return null;
      }
    }
    const normalizedRoot = normalizeWindowsSlashes(basePath).replace(/[\\/]+$/, '');
    const folderName = buildHistorialFolderName(formData);
    const folderPath = `${normalizedRoot}\\${folderName}`;
    await window.electronAPI.createDirectory(folderPath);
    const baseFolderName = buildBinFolderName(
      formData.nombreVersionCliente || formData.cliente,
      formData.esDemo ? 'DEMO' : (formData.versionBase || 'BASE')
    );
    await window.electronAPI.createDirectory(`${folderPath}\\${baseFolderName}`);
    if (!formData.esDemo && formData.incluirVersionAumento && formData.versionAumento) {
      const aumentoFolderName = buildBinFolderName(formData.nombreVersionCliente || formData.cliente, formData.versionAumento || 'AUMENTO');
      await window.electronAPI.createDirectory(`${folderPath}\\${aumentoFolderName}`);
    }
    historialFolderRef.current = folderPath;
    setLastHistorialPath(folderPath);
    return folderPath;
  };

  const actualizarChecksumsFile = async (
    folderPath: string,
    md5Base?: string,
    md5Aumento?: string,
    baseFolderName?: string,
    aumentoFolderName?: string
  ) => {
    if (!window.electronAPI || !folderPath) return;
    const baseName = baseFolderName || 'BASE';
    const aumentoName = aumentoFolderName || 'AUMENTO';

    const baseLabel = formData.esDemo ? 'DEMO' : baseName;

    const lines: string[] = [];
    lines.push(`${baseLabel}`);
    lines.push(`Checksum (MD5): ${md5Base || 'PENDIENTE'}`);

    if (md5Aumento) {
      lines.push('');
      lines.push(`${aumentoName} - AUMENTO`);
      lines.push(`Checksum (MD5): ${md5Aumento || 'PENDIENTE'}`);
    }

    const checksumsContent = `${lines.join('\n')}\n`;
    await window.electronAPI.writeTextFile(
      `${folderPath}\\checksum.txt`,
      checksumsContent
    );
  };

  const zipHistorialFolder = async (folderPath: string): Promise<string | null> => {
    if (!window.electronAPI?.zipArtifacts || !folderPath) {
      console.error('❌ zipHistorialFolder: No electronAPI.zipArtifacts o folderPath vacío');
      return null;
    }
    try {
      console.log('🔄 zipHistorialFolder: Iniciando ZIP de:', folderPath);
      const folderName = folderPath.split(/[/\\]/).filter(Boolean).pop() || `version_${Date.now()}`;
      const zipBaseName = formData.esDemo ? `DEMO_${getTodayYYMMDD()}` : folderName;
      console.log(`📦 Nombre de carpeta para ZIP: ${folderName}`);
      console.log(`📦 Nombre de ZIP: ${zipBaseName}.zip`);
      const baseFolderName = buildBinFolderName(
        formData.nombreVersionCliente || formData.cliente,
        formData.esDemo ? 'DEMO' : (formData.versionBase || 'BASE')
      );
      const aumentoFolderName = !formData.esDemo && formData.incluirVersionAumento && formData.versionAumento
        ? buildBinFolderName(formData.nombreVersionCliente || formData.cliente, formData.versionAumento || 'AUMENTO')
        : null;

      const inputsToZip = [
        `${folderPath}\\${baseFolderName}`,
        aumentoFolderName ? `${folderPath}\\${aumentoFolderName}` : null,
        `${folderPath}\\checksum.txt`
      ].filter(Boolean) as string[];

      console.log(`📦 Parámetros zipArtifacts: files=[${inputsToZip.join(', ')}], zipName=${zipBaseName}.zip, subfolder=${formData.cliente || folderName}`);
      
      const zipResult = await window.electronAPI.zipArtifacts({
        files: inputsToZip,
        zipName: `${zipBaseName}.zip`,
        subfolder: formData.cliente || folderName
      });
      
      console.log('📦 zipHistorialFolder result:', zipResult);
      if (zipResult?.ok && zipResult.path) {
        console.log('✅ ZIP creado exitosamente:', zipResult.path);
        console.log(`   Contenido será: ${inputsToZip.join(' + ')}`);
          const finalZipPath = `${folderPath}\\${zipBaseName}.zip`;
          try {
            const copyRes = await window.electronAPI.copyFile(zipResult.path, finalZipPath);
            if (copyRes?.ok) {
              console.log('✅ ZIP copiado a carpeta de historial:', finalZipPath);
              historialZipRef.current = finalZipPath;
              setLastHistorialZip(finalZipPath);
              return finalZipPath;
            } else {
              console.warn('⚠️ No se pudo copiar ZIP al historial, usando ruta TEMP:', copyRes?.error);
              historialZipRef.current = zipResult.path;
              setLastHistorialZip(zipResult.path);
              return zipResult.path;
            }
          } catch (copyErr) {
            console.warn('⚠️ Error copiando ZIP al historial, usando ruta TEMP:', copyErr);
            historialZipRef.current = zipResult.path;
            setLastHistorialZip(zipResult.path);
            return zipResult.path;
          }
      } else {
        console.warn('⚠️ zipArtifacts retornó sin ok o sin path:', zipResult);
      }
    } catch (zipError) {
      console.error('❌ Error en zipHistorialFolder:', zipError);
    }
    console.warn('⚠️ zipHistorialFolder retornando null');
    return null;
  };

  const zipHistorialFiles = async (folderPath: string, zipName: string, files: string[]): Promise<string | null> => {
    if (!window.electronAPI?.zipArtifacts || !window.electronAPI?.copyFile || !folderPath) {
      console.error('❌ zipHistorialFiles: No electronAPI.zipArtifacts/copyFile o folderPath vacío');
      return null;
    }
    const demoZip = `DEMO_${getTodayYYMMDD()}.zip`;
    const cleanZipName = (zipName || '').trim() || `artefactos-${Date.now()}.zip`;
    const finalZipName = formData.esDemo
      ? demoZip
      : (cleanZipName.toLowerCase().endsWith('.zip') ? cleanZipName : `${cleanZipName}.zip`);
    const filtered = Array.isArray(files) ? files.filter(Boolean) : [];
    if (!filtered.length) {
      console.warn('⚠️ zipHistorialFiles: no hay archivos para comprimir');
      return null;
    }

    try {
      const zipResult = await window.electronAPI.zipArtifacts({
        files: filtered,
        zipName: finalZipName,
        subfolder: formData.cliente || undefined
      });

      if (zipResult?.ok && zipResult.path) {
        const finalZipPath = `${folderPath}\\${finalZipName}`;
        try {
          const copyRes = await window.electronAPI.copyFile(zipResult.path, finalZipPath);
          if (copyRes?.ok) {
            historialZipRef.current = finalZipPath;
            setLastHistorialZip(finalZipPath);
            return finalZipPath;
          }
          console.warn('⚠️ No se pudo copiar ZIP al historial, usando ruta TEMP:', copyRes?.error);
        } catch (copyErr) {
          console.warn('⚠️ Error copiando ZIP al historial, usando ruta TEMP:', copyErr);
        }

        historialZipRef.current = zipResult.path;
        setLastHistorialZip(zipResult.path);
        return zipResult.path;
      }

      console.warn('⚠️ zipArtifacts retornó sin ok o sin path:', zipResult);
      return null;
    } catch (e) {
      console.error('❌ Error en zipHistorialFiles:', e);
      return null;
    }
  };

  const snapshotBaseBinary = async (sourceBinPath: string, checksumBase: string | null) => {
    if (!window.electronAPI || !sourceBinPath || !checksumBase) return;
    try {
      const exists = await window.electronAPI.fileExists(sourceBinPath);
      if (!exists) return;
      const folderPath = historialFolderRef.current || await ensureHistorialFolder();
      if (!folderPath) return;
      const baseFolderName = buildBinFolderName(
        formData.nombreVersionCliente || formData.cliente,
        formData.esDemo ? 'DEMO' : formData.versionBase
      );
      const copyResult = await window.electronAPI.copyFile(sourceBinPath, `${folderPath}\\${baseFolderName}\\${formData.nombreArchivoBin}`);
      if (!copyResult?.ok) {
        console.warn('⚠️ Error guardando binario BASE:', copyResult?.error);
      } else {
        console.log('✅ Binario BASE guardado en historial');
      }
      await actualizarChecksumsFile(folderPath, checksumBase, undefined, baseFolderName, undefined);
    } catch (snapshotError) {
      console.warn('No se pudo guardar el binario BASE en el historial:', snapshotError);
    }
  };

  const registrarAumentoEnHistorial = async (md5Base?: string, md5Aumento?: string) => {
    console.log('🔍 registrarAumentoEnHistorial called with md5Base:', md5Base, 'md5Aumento:', md5Aumento);
    if (!window.electronAPI) {
      console.error('❌ electronAPI no disponible');
      return { folderPath: null, zipPath: null };
    }
    const folderPath = historialFolderRef.current || await ensureHistorialFolder();
    if (!folderPath) {
      console.error('❌ No folderPath encontrado');
      return { folderPath: null, zipPath: null };
    }
    if (!formData.rutaCompilacion || !formData.nombreArchivoBin) {
      console.warn('No hay ruta/nombre de binario definidos para registrar el historial.');
      return { folderPath, zipPath: null };
    }
    const sourceBinPath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;
    
    const baseFolderName = buildBinFolderName(
      formData.nombreVersionCliente || formData.cliente,
      formData.esDemo ? 'DEMO' : formData.versionBase
    );
    const aumentoFolderName = buildBinFolderName(formData.nombreVersionCliente || formData.cliente, formData.versionAumento);
    const baseDisplayName = baseFolderName;
    const aumentoDisplayName = aumentoFolderName;

    try {
      console.log('✅ Folder path:', folderPath);
      const exists = await window.electronAPI.fileExists(sourceBinPath);
      console.log('📝 Archivo BIN existe:', exists);
      
      if (exists && md5Base && !md5Aumento) {
        console.log('📋 Copiando BASE:', sourceBinPath, '->', `${folderPath}\\${baseDisplayName}\\${formData.nombreArchivoBin}`);
        const copyBaseResult = await window.electronAPI.copyFile(sourceBinPath, `${folderPath}\\${baseDisplayName}\\${formData.nombreArchivoBin}`);
        if (!copyBaseResult?.ok) {
          console.warn('⚠️ Error copiando BASE:', copyBaseResult?.error);
        } else {
          console.log('✅ BASE copiado exitosamente');
        }
      }
      
      if (exists && md5Aumento) {
        await window.electronAPI.createDirectory(`${folderPath}\\${aumentoDisplayName}`);
        console.log('📋 Copiando AUMENTO:', sourceBinPath, '->', `${folderPath}\\${aumentoDisplayName}\\${formData.nombreArchivoBin}`);
        const copyAumentoResult = await window.electronAPI.copyFile(sourceBinPath, `${folderPath}\\${aumentoDisplayName}\\${formData.nombreArchivoBin}`);
        if (!copyAumentoResult?.ok) {
          console.warn('⚠️ Error copiando AUMENTO:', copyAumentoResult?.error);
        } else {
          console.log('✅ AUMENTO copiado exitosamente');
        }
      }
      
      await actualizarChecksumsFile(folderPath, md5Base, md5Aumento, baseFolderName, md5Aumento ? aumentoFolderName : undefined);
      console.log('🔤 Checksums actualizados');

      // Si NO hay AUMENTO, el ZIP debe incluir solo el .bin (BASE) y checksum.txt
      if (!md5Aumento) {
        const baseCopiedPath = `${folderPath}\\${baseDisplayName}\\${formData.nombreArchivoBin}`;
        const checksumPath = `${folderPath}\\checksum.txt`;
        const zipName = `${buildHistorialFolderName(formData)}.zip`;
        const zipPath = await zipHistorialFiles(folderPath, zipName, [baseCopiedPath, checksumPath]);
        console.log('📦 zipPath retornado de zipHistorialFiles (solo BASE):', zipPath);
        if (!zipPath) {
          console.error('❌ zipHistorialFiles retornó null/undefined');
          historialZipRef.current = null;
        } else {
          console.log('✅ ZIP (solo BASE) generado correctamente:', zipPath);
          historialZipRef.current = zipPath;
        }
        return { folderPath, zipPath };
      }

      const zipPath = await zipHistorialFolder(folderPath);
      console.log('📦 zipPath retornado de zipHistorialFolder:', zipPath);
      if (!zipPath) {
        console.error('❌ zipHistorialFolder retornó null/undefined');
        historialZipRef.current = null;
      } else {
        console.log('✅ ZIP generado correctamente:', zipPath);
        historialZipRef.current = zipPath;
      }
      return { folderPath, zipPath };
    } catch (historialError) {
      console.error('❌ Error en registrarAumentoEnHistorial:', historialError);
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
      const baseFolderName = buildBinFolderName(
        formData.nombreVersionCliente || formData.cliente,
        formData.esDemo ? 'DEMO' : formData.versionBase
      );
      const aumentoFolderName = buildBinFolderName(formData.nombreVersionCliente || formData.cliente, formData.versionAumento);
      await actualizarChecksumsFile(folderPath, baseValue, aumentoValue, baseFolderName, aumentoFolderName);
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

  const includeAumentoCert = formData.incluirVersionAumento ?? false;
  const isDemo = Boolean(formData.esDemo);
  const effectiveIncludeAumento = !isDemo && Boolean(formData.incluirVersionAumento);
  
  const fieldRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleWebFolderSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const names = Array.from(files).map(f => f.name.toLowerCase());
    const hasCompilePy = names.some(n => n === 'compile.py');
    const hasMakefile = names.some(n => n === 'makefile');
    const binCandidates = Array.from(new Set(names.filter(n => n.endsWith('.bin'))));
    const hasUserClearedCommand = userClearedCommandRef.current;
    setFormData(prev => {
      const next = { ...prev };
      if (!prev.comandoCompilacion && !hasUserClearedCommand) {
        next.comandoCompilacion = hasCompilePy ? 'py compile.py' : (hasMakefile ? 'make' : prev.comandoCompilacion);
      }
      if (!prev.nombreArchivoBin && binCandidates.length > 0) {
        const best = binCandidates.sort((a,b)=>b.length-a.length)[0];
        next.nombreArchivoBin = best || prev.nombreArchivoBin;
      }
      return next;
    });
  };

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
      ...(formData.esDemo ? [] : ['versionBase']),
      ...(!formData.esDemo && includeAumentoCert ? ['versionAumento'] : []),
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
    if (field === 'comandoCompilacion') {
      const trimmed = (value || '').toString().trim();
      userClearedCommandRef.current = trimmed === '';
    }
    if (formAlert) {
      setFormAlert(null);
    }
    if (field === 'esDemo') {
      // En DEMO no se solicitan versiones base/aumento, pero NO se borran los valores previos.
      if (Boolean(value)) clearErrors();
    }
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // DEMO solo desactiva el uso de base/aumento; no eliminar datos ingresados.
      
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
        const commandToSave = newData.comandoCompilacion?.trim() || '';
        const preferencesToSave = {
          cliente: newData.cliente || '',
          terminal: newData.terminal || '',
          esDemo: Boolean(newData.esDemo),
          responsable: newData.responsable || '',
          tipoFirma: newData.tipoFirma || '',
          cid: newData.cid || '',
          rutaCompilacion: newData.rutaCompilacion || '',
          rutaLocal: newData.rutaLocal || '',
          tipoDocumento: newData.tipoDocumento || '',
          versionBase: newData.versionBase || '',
          versionAumento: newData.versionAumento || '',
          descripcionBreve: newData.descripcionBreve || '',
          departamento: newData.departamento || '',
          notasTecnicas: newData.notasTecnicas || '',
          nombrePkgBase: newData.nombrePkgBase || '',
          nombreVersionCliente: newData.nombreVersionCliente || '',
          nombreArchivoBin: newData.nombreArchivoBin || '',
          linksOneDrive: newData.linksOneDrive || '',
          rutaProyecto: newData.rutaProyecto || '',
          archivoVersion: newData.archivoVersion || '',
          comandoCompilacion: commandToSave,
          compilePyMode: newData.compilePyMode || '',
          compilePyTarget: newData.compilePyTarget || '',
          incluirVersionAumento: newData.incluirVersionAumento,
          comandoCleared: userClearedCommandRef.current,
        };
        
        localStorage.setItem('versiones-app:preferencias-formulario', JSON.stringify(preferencesToSave));
        console.log('[handleInputChange] Preferencias guardadas en localStorage');
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
    if (isDemo) return;
    const nextValue = !includeAumentoCert;
    handleInputChange('incluirVersionAumento', nextValue as CrearVersionData['incluirVersionAumento']);
  };

  // Función optimizada para buscar archivo de versión con cache y búsqueda inteligente
  const findVersionFileFast = async (
    projectRoot?: string,
    manualEntry?: string,
    headerHintPath?: string | null
  ): Promise<string | null> => {
    // Si el proyecto es el mismo y ya lo buscamos, usar cache
    if (
      projectRoot &&
      projectRoot === cachedProjectRootRef.current &&
      cachedVersionFileRef.current
    ) {
      console.log('📦 Usando archivo de versión en cache:', cachedVersionFileRef.current);
      return cachedVersionFileRef.current;
    }

    // Si se proporciona una ruta manual válida, usar esa
    const manualVersionPath = resolveProjectFilePath(projectRoot, manualEntry);
    if (manualVersionPath && await window.electronAPI.fileExists(manualVersionPath)) {
      cachedVersionFileRef.current = manualVersionPath;
      cachedProjectRootRef.current = projectRoot || null;
      console.log('✅ Archivo de versión encontrado (manual):', manualVersionPath);
      return manualVersionPath;
    }

    // Si hay sugerencia del sistema, usarla
    if (headerHintPath && await window.electronAPI.fileExists(headerHintPath)) {
      cachedVersionFileRef.current = headerHintPath;
      cachedProjectRootRef.current = projectRoot || null;
      console.log('✅ Archivo de versión encontrado (sugerencia):', headerHintPath);
      return headerHintPath;
    }

    // Usar búsqueda inteligente del backend si está disponible
    if (projectRoot && window.electronAPI.findVersionFile) {
      try {
        const versionSearchOptions = {
          hintFile: manualEntry || undefined,
          versionBase: formData.versionBase || undefined,
          nombreVersionCliente: formData.nombreVersionCliente || undefined
        };
        
        const found = await window.electronAPI.findVersionFile(projectRoot, versionSearchOptions);
        if (found?.ok && found.path) {
          cachedVersionFileRef.current = found.path;
          cachedProjectRootRef.current = projectRoot;
          console.log('🔎 Archivo de versión detectado:', found.path, found.reason ? `(${found.reason})` : '');
          return found.path;
        }
      } catch (err) {
        console.warn('Error en búsqueda de versión file:', err);
      }
    }

    console.warn('⚠️ No se encontró archivo de versión');
    return null;
  };

  const updateVersionInFile = async (filePath: string, newVersion: string): Promise<boolean> => {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 250;
    
    const attemptUpdate = async (attempt: number = 1): Promise<boolean> => {
      try {
        if (!filePath || !newVersion) {
          console.error('❌ Faltan parámetros: filePath o newVersion');
          return false;
        }


        const normalizedPath = filePath.replace(/\//g, '\\');
        console.log(`📝 Actualizando ${normalizedPath} con versión ${newVersion}${attempt > 1 ? ` (intento ${attempt}/${MAX_RETRIES})` : ''}`);
        
        const exists = await window.electronAPI.fileExists(normalizedPath);
        if (!exists) {
          console.error(`❌ El archivo no existe: ${normalizedPath}`);
          return false;
        }
        
        const result = await window.electronAPI.readTextFile(normalizedPath);
        if (!result.ok || !result.content) {
          if (attempt < MAX_RETRIES) {
            console.warn(`⚠️ No se pudo leer el archivo (intento ${attempt}/${MAX_RETRIES}). Error: ${result.error}. Reintentando en ${RETRY_DELAY * attempt}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            return attemptUpdate(attempt + 1);
          }
          console.error('❌ No se pudo leer el archivo después de reintentos:', result.error);
          return false;
        }
        
        let content = result.content;
        let updated = false;
        
        const versionLinePattern = /(^\s*#define\s+VERSION\s+)("[^"]+")/gm;
        if (versionLinePattern.test(content)) {
          content = content.replace(versionLinePattern, (_full: string, prefix: string) => `${prefix}"${newVersion}"`);
          updated = true;
        }
        
        const semverParts = newVersion.split('.');
        const [major, minor, patch] = semverParts;
        const isNumericSemver = semverParts.length >= 2 && semverParts.every(part => /^\d+$/.test(part));
        if (isNumericSemver && /#define\s+VERSION_MAJOR/.test(content)) {
          if (major) content = content.replace(/(^\s*#define\s+VERSION_MAJOR\s+)(\d+)/gm, (_m: string, p1: string) => `${p1}${major}`);
          if (minor) content = content.replace(/(^\s*#define\s+VERSION_MINOR\s+)(\d+)/gm, (_m: string, p1: string) => `${p1}${minor}`);
          if (patch) content = content.replace(/(^\s*#define\s+VERSION_PATCH\s+)(\d+)/gm, (_m: string, p1: string) => `${p1}${patch}`);
          updated = true;
        }

        const mainVerPattern = /#define\s+([A-Z_]+)\s+"([A-Za-z_]*\d+[._]\d+(?:[._]\d+)?)"/g;
        let mainVerMatch;
        const mainVerMatches = [];
        
        while ((mainVerMatch = mainVerPattern.exec(content)) !== null) {
          mainVerMatches.push({
            fullMatch: mainVerMatch[0],
            varName: mainVerMatch[1],
            currentValue: mainVerMatch[2]
          });
        }
        
        const validMainVerMatches = mainVerMatches.filter(m => 
          !/^\d{8}$/.test(m.currentValue) &&
          !/^([A-Za-z_]+)?\d{8}$/.test(m.currentValue)
        );
        
        if (validMainVerMatches.length > 0) {
          const match = validMainVerMatches[0];
          console.log(`Detectado #define ${match.varName} con valor: "${match.currentValue}"`);
          
          const prefixMatch = match.currentValue.match(/^([A-Za-z_]*)/);
          const prefix = prefixMatch ? prefixMatch[1] : '';
          const newMainVer = prefix ? `${prefix}${newVersion}` : newVersion;
          
          console.log(`Actualizando ${match.varName}: "${match.currentValue}" -> "${newMainVer}"`);
          
          const replacePattern = new RegExp(`(^\\s*#define\\s+${match.varName}\\s+)"[^"]+"`, 'gm');
          content = content.replace(replacePattern, (_m: string, p1: string) => `${p1}"${newMainVer}"`);
          updated = true;
        }

        if (!updated && isNumericSemver) {
          const mainVerNoQuotes = /#define\s+([A-Z_]+)\s+([A-Za-z_]*\d+_\d+(?:_\d+)?)/g;
          let nqMatch;
          const nqMatches: Array<{ fullMatch: string; varName: string; currentValue: string }> = [];
          while ((nqMatch = mainVerNoQuotes.exec(content)) !== null) {
            nqMatches.push({ fullMatch: nqMatch[0], varName: nqMatch[1], currentValue: nqMatch[2] });
          }
          if (nqMatches.length > 0) {
            const m = nqMatches[0];
            const prefix = (m.currentValue.match(/^([A-Za-z_]*)/) || ['',''])[1];
            const replacement = `#define ${m.varName} ${prefix ? prefix + newVersion : newVersion}`;
            console.log(`Actualizando ${m.varName}: ${m.currentValue} -> ${prefix ? prefix + newVersion : newVersion}`);
            const replacePattern = new RegExp(`#define\\s+${m.varName}\\s+[A-Za-z_]*\\d+[._]\\d+(?:[._]\\d+)?`, 'g');
            content = content.replace(replacePattern, replacement);
            updated = true;
          }
        }

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
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const dateStr = `${year}${month}${day}`;
          
          console.log(`Detectado #define ${match.varName} con fecha: ${match.currentValue}`);
          console.log(`Actualizando ${match.varName} a fecha actual: ${dateStr}`);
          
          const replacePattern = new RegExp(`(^\\s*#define\\s+${match.varName}\\s+)"\\d{8}"`, 'gm');
          content = content.replace(replacePattern, (_m: string, p1: string) => `${p1}"${dateStr}"`);
          updated = true;
        }
        
        const otherVerPattern = /#define\s+([A-Z_]+(?:PARAM|CONFIG|BUILD)(?:_VERSION)?)\s+"([^"]+)"/g;
        let otherMatch;
        while ((otherMatch = otherVerPattern.exec(content)) !== null) {
          console.log(`${otherMatch[1]} detectado con valor "${otherMatch[2]}" - se mantiene sin cambios`);
        }
        
        if (!updated) {
          const fallbackPattern = /(^\s*#define\s+([A-Z_]*VER[A-Z_]*|VERSION[A-Z_]*)\s+)"([^"\n]*?)(\d+(?:[._]\d+){1,3})([^"\n]*)"/gm;
          let fbMatch = fallbackPattern.exec(content);
          if (fbMatch) {
            const prefix = fbMatch[1];
            const pre = fbMatch[3] || '';
            const post = fbMatch[5] || '';
            content = content.replace(fallbackPattern, `${prefix}"${pre}${newVersion}${post}"`);
            updated = true;
          }
        }

        if (!updated) {
          console.error('❌ No se encontró ningún patrón de versión conocido en el archivo');
          return false;
        }
        
        const writeResult = await window.electronAPI.writeTextFile(normalizedPath, content);
        if (!writeResult.ok) {
          if (attempt < MAX_RETRIES) {
            console.warn(`⚠️ No se pudo escribir el archivo (intento ${attempt}/${MAX_RETRIES}). Error: ${writeResult.error}. Reintentando en ${RETRY_DELAY * attempt}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            return attemptUpdate(attempt + 1);
          }
          console.error('❌ No se pudo escribir el archivo después de reintentos:', writeResult.error);
          return false;
        }
        
        console.log('✅ Versión actualizada exitosamente');
        return true;
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          console.warn(`⚠️ Error actualizando versión (intento ${attempt}/${MAX_RETRIES}). Reintentando en ${RETRY_DELAY * attempt}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          return attemptUpdate(attempt + 1);
        }
        console.error('❌ Error actualizando versión después de reintentos:', error);
        return false;
      }
    };

    return attemptUpdate();
  };

  const getTodayYYYYMMDD = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const updateAppHeaderMacros = async (
    filePath: string,
    options: { appMainVer?: string; appSubVer?: string }
  ): Promise<boolean> => {
    if (!window.electronAPI) return false;
    const normalizedPath = filePath.replace(/\//g, '\\');
    const exists = await window.electronAPI.fileExists(normalizedPath);
    if (!exists) return false;

    const read = await window.electronAPI.readTextFile(normalizedPath);
    if (!read.ok || !read.content) return false;

    let content = read.content;
    let updated = false;

    if (options.appMainVer) {
      const reMain = /(^\s*#define\s+APP_MAIN_VER\s+)"[^"]*"/gm;
      if (reMain.test(content)) {
        content = content.replace(reMain, (_m: string, p1: string) => `${p1}"${options.appMainVer}"`);
        updated = true;
      }
    }

    if (options.appSubVer) {
      const reSub = /(^\s*#define\s+APP_SUB_VER\s+)"[^"]*"/gm;
      if (reSub.test(content)) {
        content = content.replace(reSub, (_m: string, p1: string) => `${p1}"${options.appSubVer}"`);
        updated = true;
      }
    }

    if (!updated) return false;

    const write = await window.electronAPI.writeTextFile(normalizedPath, content);
    return Boolean(write.ok);
  };

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

  const crearCorreoOutlook = async (
    md5Aumento: string | '',
    carpetaOneDrive?: string | null,
    historialZipPath?: string | null,
    md5Base?: string | null
  ): Promise<string> => {
    try {
      console.log('🔍 ===== INICIO crearCorreoOutlook =====');
      console.log('   md5Aumento:', md5Aumento);
      console.log('   carpetaOneDrive:', carpetaOneDrive);
      console.log('   historialZipPath:', historialZipPath);
      console.log('   md5Base:', md5Base);
      
      if (!window.electronAPI) {
        console.warn('⚠️ Creación de correo solo disponible en Electron');
        return '';
      }

      const { subject, body } = crearCorreoHtml(formData as any, md5Aumento || undefined, carpetaOneDrive || null, md5Base || formData.checksumBase);
      console.log('📧 Subject generado:', subject);

      const attachments: string[] = [];
      if (historialZipPath) {
        console.log('🔍 Verificando existencia de ZIP:', historialZipPath);
        const exists = await window.electronAPI.fileExists(historialZipPath);
        console.log('   ZIP existe:', exists);
        if (exists) {
          attachments.push(historialZipPath);
          console.log(`✅ ZIP agregado a attachments array:`, historialZipPath);
        } else {
          console.warn(`⚠️ Archivo ZIP no existe en filesystem:`, historialZipPath);
        }
      } else {
        console.warn('⚠️ historialZipPath está vacío/undefined/null');
      }

      console.log(`📧 Attachments array final (length=${attachments.length}):`, attachments);
      console.log('📧 Llamando a createOutlookDraft con:');
      console.log('   subject:', subject);
      console.log('   body length:', body.length);
      console.log('   attachments:', attachments);
      
      const resultado = await window.electronAPI.createOutlookDraft({
        subject,
        body,
        to: '',
        send: false,
        saveToSent: false,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      console.log('📧 Resultado de createOutlookDraft:', resultado);
      if (resultado.ok) {
        console.log(`✅ Correo creado exitosamente con ${attachments.length} adjunto(s)`);
        return subject;
      }
      console.error('❌ Error creando correo:', resultado.error);
      return '';
    } catch (error) {
      console.error('❌ Error en crearCorreoOutlook:', error);
      return '';
    } finally {
      console.log('🔍 ===== FIN crearCorreoOutlook =====');
    }
  };

  const handleCreateEmail = async (md5Aumento: string | '', historialZipPath?: string | null, md5Base?: string | null): Promise<string> => {
    console.log('🔍 ===== INICIO handleCreateEmail =====');
    console.log('   md5Aumento:', md5Aumento);
    console.log('   historialZipPath:', historialZipPath);
    console.log('   md5Base:', md5Base);
    console.log('   typeof historialZipPath:', typeof historialZipPath);
    console.log('   historialZipPath === null:', historialZipPath === null);
    console.log('   historialZipPath === undefined:', historialZipPath === undefined);
    
    setProgressStep('📧 Generando correo en Outlook...');
    const asuntoCorreo = await crearCorreoOutlook(md5Aumento, undefined, historialZipPath, md5Base);
    
    console.log('   asuntoCorreo devuelto:', asuntoCorreo);
    console.log('🔍 ===== FIN handleCreateEmail =====');
    return asuntoCorreo;
  };

  useEffect(() => {
    if (waitingForAumentoCompile) {
      setCompilationDetected(false);
      setChecksumWarning('');
      checksumErrorShownRef.current = false;
      startFileMonitoring();
    }
  }, [formData.versionAumento]);

  const iniciarMonitoreoRespuesta = (asuntoCorreo: string): void => {
    if (!window.electronAPI) {
      console.warn('⚠️ Monitoreo solo disponible en Electron');
      return;
    }

    console.log('🔍 Iniciando monitoreo de respuesta...');
    
    monitoringIntervalRef.current = setInterval(async () => {
      try {
        const resultado = await window.electronAPI.checkOutlookReplies({
          subjectKeyword: asuntoCorreo
        });

        if (resultado.ok && resultado.replies && resultado.replies.length > 0) {
          console.log(`✅ ${resultado.count} respuesta(s) encontrada(s)`);
          
          const respuestaAprobada = resultado.replies.some((reply: any) => 
            reply.body.toLowerCase().includes('aprobado') || 
            reply.body.toLowerCase().includes('firmado') ||
            reply.body.toLowerCase().includes('ok')
          );

          if (respuestaAprobada) {
            if (monitoringIntervalRef.current) {
              clearInterval(monitoringIntervalRef.current);
              monitoringIntervalRef.current = null;
            }
            
            console.log('🎉 ¡Versión aprobada! Transicionando a certificación...');
            setFormAlert('🎉 ¡Versión aprobada! La certificación se creará automáticamente.');
          }
        }
      } catch (error) {
        console.error('❌ Error verificando respuestas:', error);
      }
    }, 5 * 60 * 1000);

    console.log('✅ Monitoreo iniciado (verificando cada 5 minutos)');
  };

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
      
      const resultado = await window.electronAPI.readTextFile(roadmapPath);
      let contenidoActual = '';
      
      if (resultado.ok && resultado.content) {
        contenidoActual = resultado.content;
      } else {
        contenidoActual = `# Roadmap - Versiones\n\nHistorial de versiones entregadas y certificadas.\n\n---\n\n`;
      }

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

  const startFileMonitoring = (baseChecksumOverride?: string, mode: 'compare' | 'simple' = 'compare') => {
    if (!formData.rutaCompilacion || !formData.nombreArchivoBin) return;
    const binFilePath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;

    // Para modo compare, se usa checksum base; para modo simple NO se comparan checksums.
    if (mode === 'compare') {
      const checksumBaseToUse = baseChecksumOverride || formData.checksumBase;
      baseChecksumRef.current = checksumBaseToUse || null;
    } else {
      baseChecksumRef.current = null;
    }

    if (checkFileIntervalRef.current) {
      clearInterval(checkFileIntervalRef.current);
      checkFileIntervalRef.current = null;
    }
    setCompilationDetected(false);
    setChecksumWarning('');
    checksumErrorShownRef.current = false;
    hasDetectedAnyChangeRef.current = false; // Resetear bandera de cambios
    lastMonitoredMd5Ref.current = null; // Se inicializa con el MD5 actual más abajo
    lastMonitoredMtimeRef.current = null; // Limpiar mtime anterior
    lastMonitoredSizeRef.current = null;

    // Refrescar el checksum base desde el formulario SOLO si no hay override y solo en modo compare
    if (mode === 'compare' && !baseChecksumOverride) {
      baseChecksumRef.current = (formData.checksumBase || '').trim() || null;
    }

    (async () => {
      try {
        const stat = await window.electronAPI.getFileStat(binFilePath);
        fileMissingAtStartRef.current = !stat?.ok;
        lastMonitoredMtimeRef.current = stat?.ok ? (stat.mtimeMs ?? null) : null;
        lastMonitoredSizeRef.current = stat?.ok ? (stat.size ?? null) : null;
      } catch {
        fileMissingAtStartRef.current = true;
        lastMonitoredMtimeRef.current = null;
        lastMonitoredSizeRef.current = null;
      }
      try {
        if (mode === 'compare') {
          const md5Initial = await window.electronAPI.computeMd5(binFilePath);

          if (!baseChecksumRef.current && md5Initial) {
            baseChecksumRef.current = md5Initial;
            setFormData(prev => ({ ...prev, checksumBase: md5Initial }));
          }
          console.log(`🎯 Monitoreo iniciado (compare) - BASE esperado: ${baseChecksumRef.current?.substring(0, 12) || 'ninguno'}`);
          console.log(`🎯 MD5 actual del archivo: ${md5Initial?.substring(0, 12) || 'ninguno'}`);
        } else {
          console.log('🎯 Monitoreo iniciado (simple) - esperando cambio en .bin (mtime/size)');
        }
      } catch {
      }
    })();

    checkFileIntervalRef.current = setInterval(async () => {
      try {
        const stat = await window.electronAPI.getFileStat(binFilePath);
        const mtime = stat?.ok ? (stat.mtimeMs ?? null) : null;
        const size = stat?.ok ? (stat.size ?? null) : null;

        // Modo simple: solo detectar cambio del archivo (.bin) y seguir.
        if (mode === 'simple') {
          if (!stat?.ok) {
            return;
          }

          if (fileMissingAtStartRef.current) {
            console.log('✅ .bin creado/detectado por primera vez (simple)');
            setCompilationDetected(true);
            fileMissingAtStartRef.current = false;
            if (checkFileIntervalRef.current) {
              clearInterval(checkFileIntervalRef.current);
              checkFileIntervalRef.current = null;
            }
            lastMonitoredMtimeRef.current = mtime;
            lastMonitoredSizeRef.current = size;
            return;
          }

          const mtimeChanged = Boolean(
            typeof mtime === 'number' && typeof lastMonitoredMtimeRef.current === 'number' && mtime !== lastMonitoredMtimeRef.current
          );
          const sizeChanged = Boolean(
            typeof size === 'number' && typeof lastMonitoredSizeRef.current === 'number' && size !== lastMonitoredSizeRef.current
          );

          if (mtimeChanged || sizeChanged) {
            console.log('✅ Cambio detectado en .bin (simple):', { mtimeChanged, sizeChanged });
            setCompilationDetected(true);
            if (checkFileIntervalRef.current) {
              clearInterval(checkFileIntervalRef.current);
              checkFileIntervalRef.current = null;
            }
            lastMonitoredMtimeRef.current = mtime;
            lastMonitoredSizeRef.current = size;
            return;
          }

          lastMonitoredMtimeRef.current = mtime;
          lastMonitoredSizeRef.current = size;
          return;
        }

        // Modo compare: comportamiento anterior (validar BASE vs AUMENTO)
        const md5Current = await window.electronAPI.computeMd5(binFilePath);
        if (!md5Current) return;
        const baseChecksumCurrent = baseChecksumRef.current;

        const mtimeChanged = Boolean(
          typeof mtime === 'number' && typeof lastMonitoredMtimeRef.current === 'number' && mtime !== lastMonitoredMtimeRef.current
        );
        const md5Changed = Boolean(lastMonitoredMd5Ref.current && md5Current !== lastMonitoredMd5Ref.current);

        console.log('🔍 Monitoreo de compilación:', {
          mtimeChanged,
          md5Changed,
          md5Current: md5Current.substring(0, 12),
          md5Last: lastMonitoredMd5Ref.current?.substring(0, 12),
          checksumBase: baseChecksumCurrent?.substring(0, 12),
          sonIguales: baseChecksumCurrent ? md5Current === baseChecksumCurrent : false,
          archivo: binFilePath
        });

        // Caso especial: no hay BASE conocida.
        // - Si el archivo NO existía al inicio, la primera aparición del .bin se considera compilación válida.
        // - Si el archivo ya existía, se requiere un cambio de MD5.
        if (!baseChecksumCurrent) {
          const isFirstMd5 = !lastMonitoredMd5Ref.current;
          if (fileMissingAtStartRef.current && isFirstMd5) {
            console.log('✅ .bin detectado por primera vez (sin BASE conocida) - compilación válida');
            setChecksumWarning('');
            setCompilationDetected(true);
            fileMissingAtStartRef.current = false;
            if (checkFileIntervalRef.current) {
              clearInterval(checkFileIntervalRef.current);
              checkFileIntervalRef.current = null;
            }
            lastMonitoredMtimeRef.current = mtime;
            lastMonitoredMd5Ref.current = md5Current;
            return;
          }

          if (!isFirstMd5 && md5Changed && !compilationDetected) {
            console.log('✅ MD5 cambió (sin BASE conocida) - compilación válida');
            setChecksumWarning('');
            setCompilationDetected(true);
            if (checkFileIntervalRef.current) {
              clearInterval(checkFileIntervalRef.current);
              checkFileIntervalRef.current = null;
            }
            lastMonitoredMtimeRef.current = mtime;
            lastMonitoredMd5Ref.current = md5Current;
            return;
          }

          lastMonitoredMtimeRef.current = mtime;
          lastMonitoredMd5Ref.current = md5Current;
          return;
        }

        // Caso: mtime cambió pero MD5 no, y coincide con BASE -> compilación sin cambios
        if (mtimeChanged && baseChecksumCurrent && md5Current === baseChecksumCurrent && !md5Changed) {
          if (!checksumErrorShownRef.current) {
            console.log('❌ CHECKSUMS IDÉNTICOS - mtime cambió pero MD5 igual al BASE');
            setChecksumWarning('Los checksums son idénticos. Realice un "clean" y compile nuevamente.');
            setCompilationDetected(false);
            checksumErrorShownRef.current = true;
          }
        }

        if (md5Changed) {
          hasDetectedAnyChangeRef.current = true;
          console.log('🔔 CAMBIO DETECTADO - Compilación en progreso');
          console.log(`   MD5 anterior: ${lastMonitoredMd5Ref.current?.substring(0, 12)}`);
          console.log(`   MD5 actual: ${md5Current.substring(0, 12)}`);

          // Limpiar advertencias previas
          if (checksumErrorShownRef.current || checksumWarning) {
            setChecksumWarning('');
          }
          checksumErrorShownRef.current = false;

          // Evaluar inmediatamente el estado vs BASE al detectar cambio
          if (baseChecksumCurrent) {
            if (md5Current === baseChecksumCurrent) {
              console.log('❌ CHECKSUMS IDÉNTICOS - tras cambio de MD5');
              setChecksumWarning('Los checksums son idénticos. Realice un "clean" y compile nuevamente.');
              setCompilationDetected(false);
              checksumErrorShownRef.current = true;
            } else {
              console.log('✅ MD5 diferente al BASE - compilación válida');
              console.log(`   BASE: ${baseChecksumCurrent.substring(0, 12)}, Actual: ${md5Current.substring(0, 12)}`);
              setChecksumWarning('');
              checksumErrorShownRef.current = false;
              setCompilationDetected(true);
              if (checkFileIntervalRef.current) {
                clearInterval(checkFileIntervalRef.current);
                checkFileIntervalRef.current = null;
              }
            }
          } else {
            // Sin base conocida, no habilitar
            setCompilationDetected(false);
          }
        } else if (hasDetectedAnyChangeRef.current && baseChecksumCurrent) {
          // MD5 estable después de un cambio previo: reevaluar (por si el primer cambio coincidía con BASE)
          if (md5Current === baseChecksumCurrent) {
            if (!checksumErrorShownRef.current) {
              console.log('❌ CHECKSUMS IDÉNTICOS - MD5 compilado igual al BASE');
              setChecksumWarning('Los checksums son idénticos. Realice un "clean" y compile nuevamente.');
              setCompilationDetected(false);
              checksumErrorShownRef.current = true;
            }
          } else if (!compilationDetected) {
            console.log('✅ MD5 diferente al BASE - compilación válida (estabilizado)');
            console.log(`   BASE: ${baseChecksumCurrent.substring(0, 12)}, Actual: ${md5Current.substring(0, 12)}`);
            setChecksumWarning('');
            checksumErrorShownRef.current = false;
            setCompilationDetected(true);
            if (checkFileIntervalRef.current) {
              clearInterval(checkFileIntervalRef.current);
              checkFileIntervalRef.current = null;
            }
          }
        }

        lastMonitoredMtimeRef.current = mtime;
        lastMonitoredMd5Ref.current = md5Current;
        lastMonitoredSizeRef.current = size;
      } catch (err) {
        console.error('❌ Error en monitoreo:', err);
      }
    }, 300);
  };

  useEffect(() => {
    if (!formData.rutaProyecto && formData.rutaCompilacion) {
      setFormData(prev => {
        if (prev.rutaProyecto) return prev;
        return { ...prev, rutaProyecto: prev.rutaCompilacion };
      });
    }
  }, [formData.rutaProyecto, formData.rutaCompilacion]);

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
        // Paralelizar búsquedas de archivos de compilación y binarios para optimizar IO
        const [compileResult, binResult] = await Promise.all([
          electronAPI.findFiles(rutaProyecto, ['compile.py', 'Compile.py', 'compile.sh', 'Makefile', 'makefile']),
          electronAPI.findFiles(rutaProyecto, ['.bin'])
        ]);

        if (cancelled) return;

        let detectedCommand = '';
        let detectedScriptDir = '';
        let detectedBinDir = '';
        let detectedBinName = '';

        if (compileResult?.ok && Array.isArray(compileResult.matches) && compileResult.matches.length > 0) {
          const found = compileResult.matches[0];
          const fileStillExists = await window.electronAPI.fileExists(found);
          
          if (fileStillExists) {
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

        const allowDetectedCommand = !userClearedCommandRef.current;

        // Verificar si el comando actual hace referencia a un archivo que ya no existe
        if (allowDetectedCommand && formData.comandoCompilacion && !detectedCommand) {
          const currentCommandMatch = formData.comandoCompilacion.match(/(?:py|python|bash|sh)\s+([^\s]+)/i);
          if (currentCommandMatch) {
            const scriptFileName = currentCommandMatch[1];
            const possiblePath = formData.rutaProyecto ? `${formData.rutaProyecto}\\${scriptFileName}` : scriptFileName;
            const fileStillExists = await window.electronAPI.fileExists(possiblePath);
            
            if (!fileStillExists) {
              setFormData(prev => ({
                ...prev,
                comandoCompilacion: ''
              }));
              console.log(`🗑️ Comando de compilación limpiado: archivo ${scriptFileName} no existe`);
            }
          }
        }

        if (detectedCommand || detectedBinDir || detectedBinName || (!formData.rutaCompilacion && detectedScriptDir)) {
          setFormData(prev => {
            const next = { ...prev };
            let changed = false;

            if (allowDetectedCommand && detectedCommand && next.comandoCompilacion !== detectedCommand) {
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
    }, 250);

    return () => {
      cancelled = true;
      clearPendingTimeout();
    };
  }, [formData.rutaProyecto]);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedRaw = localStorage.getItem('versiones-app:preferencias-formulario');
        if (savedRaw) {
          const saved = JSON.parse(savedRaw);
          userClearedCommandRef.current = Boolean(saved?.comandoCleared);
          if (saved?.comandoCleared) {
            setFormData(prev => ({ ...prev, comandoCompilacion: '' }));
          }
        }
      } catch {
        userClearedCommandRef.current = false;
      }
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

  useEffect(() => {
    if (!isOpen) {
      console.log('Modal cerrado - Limpiando notificaciones...');
    }
  }, [isOpen]);

  const ejecutarFlujoAutomaticoSoloBase = async () => {
    try {
      if (!window.electronAPI) {
        setErrorModal({ show: true, title: 'Modo no disponible', message: 'La compilación automática solo está disponible en la app de escritorio (Electron).' });
        return;
      }
      setIsCalculatingChecksums(true);

      if (!formData.rutaProyecto || !formData.comandoCompilacion || (!formData.esDemo && !formData.versionBase)) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({
          show: true,
          title: 'Configuración incompleta',
          message:
            'Faltan campos para compilación automática (solo BASE):\n\n' +
            `Ruta proyecto: ${formData.rutaProyecto || 'FALTA'}\n` +
            `Comando: ${formData.comandoCompilacion || 'FALTA'}\n` +
            `Versión base: ${formData.esDemo ? 'DEMO (no requerida)' : (formData.versionBase || 'FALTA')}`
        });
        return;
      }

      if (!formData.rutaCompilacion || !formData.nombreArchivoBin) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({
          show: true,
          title: 'Faltan datos del .bin',
          message: 'Debes proporcionar la ruta de compilación y el nombre del archivo .bin para compilar automáticamente.'
        });
        return;
      }

      const projectRoot = normalizeWindowsSlashes(formData.rutaProyecto);
      const compilationDir = resolveCompilationCwd(formData.comandoCompilacion, formData.rutaProyecto, formData.rutaCompilacion) || projectRoot;
      const binFilePath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;

      if (formData.esDemo) {
        setShowProgressModal(false);
        setProgressStep('');
        setCompilationDetected(false);

        // Si hay configuración de compilación, forzar macros a DEMO antes de que el usuario compile.
        try {
          const projectRoot = normalizeWindowsSlashes(formData.rutaProyecto);
          const manualEntry = formData.archivoVersion?.trim();
          const headerHintPath = artifactHints.headerPath ? normalizeWindowsSlashes(artifactHints.headerPath) : null;
          const versionFilePath = (await findVersionFileFast(projectRoot, manualEntry, headerHintPath)) || '';

          if (!versionFilePath || !(await window.electronAPI.fileExists(versionFilePath))) {
            setErrorModal({
              show: true,
              title: 'Archivo de versión no encontrado',
              message:
                `No se encontró el archivo de macros para DEMO.\n\n` +
                `Ruta del proyecto: ${projectRoot || '—'}\n` +
                `Archivo indicado: ${manualEntry || '—'}\n` +
                `Sugerencia detectada: ${headerHintPath || '—'}`
            });
            return;
          }

          const ok = await updateAppHeaderMacros(versionFilePath, {
            appMainVer: 'DEMO',
            appSubVer: getTodayYYYYMMDD()
          });

          if (!ok) {
            setErrorModal({
              show: true,
              title: 'No se pudo actualizar macros DEMO',
              message:
                `No se pudieron actualizar APP_MAIN_VER/APP_SUB_VER en:\n\n${versionFilePath}\n\n` +
                'Verifica que el archivo exista, no esté bloqueado y contenga las macros #define APP_MAIN_VER y #define APP_SUB_VER.'
            });
            return;
          }
        } catch (err) {
          console.warn('No se pudo actualizar macros DEMO:', err);
          setErrorModal({
            show: true,
            title: 'Error actualizando macros DEMO',
            message: `Ocurrió un error actualizando el archivo de versión: ${err}`
          });
          return;
        }

        setWaitingForBaseCompile(true);

        // Esperar a que el usuario compile (no ejecutar runCompilation en DEMO).
        // Requisito: detectar SOLO cambio del .bin (mtime/size o aparición).
        startFileMonitoring(undefined, 'simple');

        const startedAt = Date.now();
        const timeoutMs = 30 * 60 * 1000;
        while (!compilationDetectedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 350));
          if (Date.now() - startedAt > timeoutMs) {
            setWaitingForBaseCompile(false);
            setShowProgressModal(false);
            setIsCalculatingChecksums(false);
            setErrorModal({
              show: true,
              title: 'Tiempo de espera agotado',
              message: 'No se detectó una compilación válida del .bin dentro del tiempo de espera. Compila nuevamente y vuelve a intentar.'
            });
            return;
          }
        }

        setWaitingForBaseCompile(false);
        setShowProgressModal(true);

        setProgressStep('🔐 Calculando checksum DEMO...');
        const md5After = await window.electronAPI.computeMd5(binFilePath);
        if (!md5After) {
          setShowProgressModal(false);
          setIsCalculatingChecksums(false);
          setErrorModal({
            show: true,
            title: 'Checksum inválido',
            message: `No se pudo leer el binario compilado en:\n\n${binFilePath}`
          });
          return;
        }

        setFormData(prev => ({ ...prev, checksumBase: md5After, checksumAumento: '' }));
        setProgressStep('📦 Guardando historial y creando ZIP (DEMO)...');
        const info = await registrarAumentoEnHistorial(md5After, undefined);
        const zipPath = info?.zipPath || historialZipRef.current;
        await handleCreateEmail('', zipPath || undefined, md5After);

        setProgressStep('✅ Proceso completado (DEMO)');
        setIsCalculatingChecksums(false);
        setShowProgressModal(false);

        const dataFinal: CrearVersionData = {
          ...formData,
          checksumBase: md5After,
          checksumAumento: undefined,
          versionAumento: undefined
        };
        onSubmit(dataFinal);
        handleClose();
        return;
      }

      setShowProgressModal(true);

      const isCompilePy = /compile\.py/i.test(formData.comandoCompilacion || '');
      const stdinData = isCompilePy ? `${formData.compilePyMode || '2'}\n${formData.compilePyTarget || '2'}\n` : undefined;

      if (!formData.esDemo) {
        setProgressStep('🔎 Buscando archivo de versión...');
        const manualEntry = formData.archivoVersion?.trim();
        const headerHintPath = artifactHints.headerPath ? normalizeWindowsSlashes(artifactHints.headerPath) : null;
        const versionFilePath = (await findVersionFileFast(projectRoot, manualEntry, headerHintPath)) || '';

        const baseVersion = formData.versionBase?.trim();
        if (!baseVersion) {
          setShowProgressModal(false);
          setIsCalculatingChecksums(false);
          setErrorModal({
            show: true,
            title: 'Falta versión BASE',
            message: 'Para compilar automáticamente debes indicar la versión BASE (X.Y.Z).'
          });
          return;
        }

        if (!versionFilePath || !(await window.electronAPI.fileExists(versionFilePath))) {
          setShowProgressModal(false);
          setIsCalculatingChecksums(false);
          setErrorModal({
            show: true,
            title: 'Archivo no encontrado',
            message:
              `No se encontró el archivo de versión para actualizar BASE.\n\n` +
              `Ruta del proyecto: ${projectRoot || '—'}\n` +
              `Archivo indicado: ${manualEntry || '—'}\n` +
              `Sugerencia detectada: ${headerHintPath || '—'}`
          });
          return;
        }

        // Forzar macros principales antes de compilar automáticamente.
        // - APP_MAIN_VER: nombre de versión cliente (ej: ENLACEAV)
        // - APP_SUB_VER: fecha YYYYMMDD
        const appMain = (formData.nombreVersionCliente || '').trim() || 'ENLACEAV';
        const okMacros = await updateAppHeaderMacros(versionFilePath, {
          appMainVer: appMain,
          appSubVer: getTodayYYYYMMDD()
        });
        if (!okMacros) {
          setShowProgressModal(false);
          setIsCalculatingChecksums(false);
          setErrorModal({
            show: true,
            title: 'No se pudo actualizar macros',
            message:
              `No se pudieron actualizar APP_MAIN_VER/APP_SUB_VER en:\n\n${versionFilePath}\n\n` +
              'Verifica que el archivo exista, no esté bloqueado y contenga las macros #define APP_MAIN_VER y #define APP_SUB_VER.'
          });
          return;
        }

        setProgressStep('📝 Actualizando versión BASE en código...');
        const okVersion = await updateVersionInFile(versionFilePath, baseVersion);
        if (!okVersion) {
          setShowProgressModal(false);
          setIsCalculatingChecksums(false);
          setErrorModal({
            show: true,
            title: 'No se pudo actualizar la versión BASE',
            message:
              `No se pudo actualizar la versión BASE (${baseVersion}) en:\n\n${versionFilePath}\n\n` +
              'Verifica permisos del archivo y que contenga un patrón de versión soportado.'
          });
          return;
        }
      } else {
        setProgressStep('ℹ️ DEMO: saltando actualización de versión en código...');
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      setProgressStep('🔨 Compilando versión BASE...');
      const compileResult = await window.electronAPI.runCompilation(formData.comandoCompilacion, compilationDir, stdinData);
      if (!compileResult?.ok) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        const details = [compileResult?.stderr, compileResult?.stdout].filter(Boolean).join('\n');
        setErrorModal({
          show: true,
          title: 'Error compilando BASE',
          message:
            (details?.trim()
              ? `La compilación de la versión BASE falló.\n\nCWD: ${compilationDir}\nComando: ${formData.comandoCompilacion}\n\n${details}`
              : `La compilación de la versión BASE falló.\n\nCWD: ${compilationDir}\nComando: ${formData.comandoCompilacion}`)
        });
        return;
      }

      setProgressStep('🔐 Calculando checksum BASE...');
      const md5Base = await window.electronAPI.computeMd5(binFilePath);
      if (!md5Base) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({
          show: true,
          title: 'Checksum BASE inválido',
          message: `No se pudo leer el binario compilado en:\n\n${binFilePath}`
        });
        return;
      }

      setFormData(prev => ({ ...prev, checksumBase: md5Base, checksumAumento: '' }));

      setProgressStep('📦 Guardando historial y creando ZIP (solo BASE)...');
      const info = await registrarAumentoEnHistorial(md5Base, undefined);
      const zipPath = info?.zipPath || historialZipRef.current;

      await handleCreateEmail('', zipPath || undefined, md5Base);

      setProgressStep('✅ Proceso completado (solo BASE)');
      setIsCalculatingChecksums(false);
      setShowProgressModal(false);

      const dataFinal: CrearVersionData = {
        ...formData,
        checksumBase: md5Base,
        checksumAumento: undefined,
        versionAumento: undefined
      };
      onSubmit(dataFinal);
      handleClose();
    } catch (error) {
      console.error('❌ Error en flujo automático (solo BASE):', error);
      setShowProgressModal(false);
      setIsCalculatingChecksums(false);
      setErrorModal({ show: true, title: '❌ Error inesperado', message: `Ocurrió un error: ${error}` });
    }
  };

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
      if (formData.tipoDocumento === 'firma') {
        setIsCalculatingChecksums(true);
        setShowProgressModal(true);
        setProgressStep('⚙️ Procesando versión BASE...');
        
        if (!formData.rutaCompilacion || !formData.nombreArchivoBin) {
          setErrorModal({ show: true, title: 'Faltan datos', message: 'Debes proporcionar la ruta de compilación y el nombre del archivo .bin' });
          setIsCalculatingChecksums(false);
          setShowProgressModal(false);
          isSubmittingRef.current = false;
          return;
        }

        const binFilePath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;

        // Compilación automática SOLO BASE
        // Requisito: si el usuario NO incluye AUMENTO y tiene configuración de compilación automática,
        // se actualiza el archivo de versión y se compila, entregando un ZIP con solo .bin + checksum.
        const wantsOnlyBase = Boolean(formData.esDemo) || !(formData.incluirVersionAumento ?? false);
        const canRunAutoBase = Boolean(
          wantsOnlyBase &&
          window.electronAPI &&
          formData.rutaProyecto &&
          formData.comandoCompilacion &&
          (formData.esDemo || formData.versionBase)
        );

        if (canRunAutoBase) {
          setShowProgressModal(false);
          setIsCalculatingChecksums(false);
          isSubmittingRef.current = false;
          console.log('✅ Flujo automático: SOLO BASE iniciado');
          await ejecutarFlujoAutomaticoSoloBase();
          return;
        }
        
        if (!formData.esDemo && (formData.rutaProyecto && formData.archivoVersion && formData.comandoCompilacion) && (formData.incluirVersionAumento ?? false)) {
          setShowProgressModal(false);
          setIsCalculatingChecksums(false);
          isSubmittingRef.current = false;
          console.log('✅ Flujo automático: BASE + AUMENTO iniciado');
          await handleAumentoYes(formData.checksumBase);
          return;
        }

        let md5Base: string | null = null;

        if (window.electronAPI?.computeMd5) {
          md5Base = await window.electronAPI.computeMd5(binFilePath);

          if (!md5Base) {
            setShowProgressModal(false);
            setIsCalculatingChecksums(false);
            isSubmittingRef.current = false;
            setErrorModal({
              show: true,
              title: 'Falta compilación (BASE)',
              message:
                `No se encontró el archivo .bin de la versión BASE en:\n\n${binFilePath}\n\n` +
                'En modo manual debes compilar antes de entregar.\n\n' +
                '1) Compila el proyecto\n2) Verifica que se genere/actualice el .bin\n3) Vuelve a presionar "Crear Versión"'
            });
            return;
          }

          console.log('✅ MD5 BASE calculado:', md5Base);
        } else {
          // Modo web: usar checksum manual ingresado
          md5Base = formData.checksumBase || null;
          if (!md5Base) {
            setShowProgressModal(false);
            setIsCalculatingChecksums(false);
            isSubmittingRef.current = false;
            setErrorModal({ show: true, title: '❌ Falta checksum BASE', message: 'En modo web, debes ingresar manualmente el checksum BASE (MD5) del archivo .bin compilado.' });
            return;
          }
          console.log('✅ MD5 BASE manual:', md5Base);
        }
        
        if (!effectiveIncludeAumento && window.electronAPI && !canRunAutoBase) {
          setShowProgressModal(false);
          setProgressStep('');
          setCompilationDetected(false);
          setWaitingForBaseCompile(true);

          // Requisito: en modo manual SOLO BASE/DEMO, detectar SOLO cambio del .bin (mtime/size o aparición).
          startFileMonitoring(undefined, 'simple');

          const startedAt = Date.now();
          const timeoutMs = 30 * 60 * 1000;
          while (!compilationDetectedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 350));
            if (Date.now() - startedAt > timeoutMs) {
              setWaitingForBaseCompile(false);
              setShowProgressModal(false);
              setIsCalculatingChecksums(false);
              isSubmittingRef.current = false;
              setErrorModal({
                show: true,
                title: 'Tiempo de espera agotado',
                message: 'No se detectó una compilación válida del .bin dentro del tiempo de espera. Compila nuevamente y vuelve a intentar.'
              });
              return;
            }
          }

          setWaitingForBaseCompile(false);
          setShowProgressModal(true);
          setProgressStep('🔐 Calculando checksum BASE...');

          const md5After = await window.electronAPI.computeMd5(binFilePath);
          if (!md5After) {
            setShowProgressModal(false);
            setIsCalculatingChecksums(false);
            isSubmittingRef.current = false;
            setErrorModal({
              show: true,
              title: 'Checksum BASE inválido',
              message: `No se pudo leer el binario compilado en:\n\n${binFilePath}`
            });
            return;
          }
          md5Base = md5After;
        }
        
        setFormData(prev => ({ ...prev, checksumBase: md5Base! }));
        if (window.electronAPI && md5Base) {
          await snapshotBaseBinary(binFilePath, md5Base);
        }

        setShowProgressModal(false);
        setIsCalculatingChecksums(false);

        if (!effectiveIncludeAumento) {
          await handleAumentoNo(md5Base);
          isSubmittingRef.current = false;
          return;
        } else {
          await handleAumentoYes(md5Base || undefined);
          isSubmittingRef.current = false;
          return;
        }
      }

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

  const handleAumentoYes = async (checksumBase?: string) => {
    checksumErrorShownRef.current = false;
    
    const tieneCompilacionAuto = !!(!formData.esDemo && formData.rutaProyecto && formData.archivoVersion && formData.comandoCompilacion);
    
    if (tieneCompilacionAuto) {
      await ejecutarFlujoAutomatico();
    } else {
      setCompilationDetected(false);
      setWaitingForAumentoCompile(true);
      startFileMonitoring(checksumBase);
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
          title: 'Configuración incompleta', 
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

      setProgressStep('⚙️ Iniciando proceso...');
      const projectRoot = formData.rutaProyecto ? normalizeWindowsSlashes(formData.rutaProyecto) : '';
      const versionSearchBase = projectRoot || formData.rutaProyecto || '';
      let versionFilePath = '';
      let compilationDir = versionSearchBase;
      let originalVersionContent: string | null = null;
      const manualEntry = formData.archivoVersion?.trim();
      const headerHintPath = artifactHints.headerPath ? normalizeWindowsSlashes(artifactHints.headerPath) : null;

      // Usar búsqueda optimizada con cache
      versionFilePath = await findVersionFileFast(projectRoot, manualEntry, headerHintPath) || '';

      if (!versionFilePath || !(await window.electronAPI.fileExists(versionFilePath))) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({ 
          show: true, 
          title: 'Archivo no encontrado', 
          message: `No se encontró el archivo de versión.\n\nRuta del proyecto: ${versionSearchBase || '—'}\nArchivo indicado: ${manualEntry || '—'}\nSugerencia detectada: ${headerHintPath || '—'}\n\nVerifica que el archivo existe en la ruta indicada.` 
        });
        return;
      }

      setProgressStep('🧪 Verificando/actualizando versión BASE en código...');
      let baseVersionContent: string | null = null;
      try {
        if (versionFilePath && formData.versionBase) {
          const currentContent = await window.electronAPI.readTextFile(versionFilePath);
          if (currentContent?.ok && currentContent.content) {
            baseVersionContent = currentContent.content;
            const basePattern = new RegExp(`"${formData.versionBase.replace(/\./g, '\\.')}"`, 'i');
            if (baseVersionContent && !basePattern.test(baseVersionContent)) {
              await updateVersionInFile(versionFilePath, formData.versionBase);
            }
          }
        }
      } catch {}

      setProgressStep('⚙️ Procesando versión BASE...');
      console.log('🔨 Compilando BASE con comando:', formData.comandoCompilacion);
      
      // Verificar si el binario BASE ya existe y tiene checksum válido
      let shouldRecompileBase = true;
      const existingBinChecksum = await window.electronAPI.computeMd5(binFilePath);
      
      if (existingBinChecksum && formData.checksumBase === existingBinChecksum) {
        console.log('✅ Binario BASE ya existe con checksum válido. No es necesario recompilar.');
        shouldRecompileBase = false;
        checksumBaseAuto = existingBinChecksum;
      } else {
        console.log('Compilando BASE porque: binario no existe o checksum diferente');
      }
      
      if (shouldRecompileBase) {
        const baseCompileResult = await window.electronAPI.runCompilation(
          formData.comandoCompilacion!,
          resolveCompilationCwd(formData.comandoCompilacion, formData.rutaProyecto, formData.rutaCompilacion) || compilationDir,
          stdinData
        );

        if (!baseCompileResult.ok) {
          setShowProgressModal(false);
          setIsCalculatingChecksums(false);
          const details = [baseCompileResult?.stderr, baseCompileResult?.stdout].filter(Boolean).join('\n');
          setErrorModal({
            show: true,
            title: 'Error compilando BASE',
            message:
              (details?.trim()
                ? `La compilación de la versión BASE falló.\n\nCWD: ${resolveCompilationCwd(formData.comandoCompilacion, formData.rutaProyecto, formData.rutaCompilacion) || compilationDir}\nComando: ${formData.comandoCompilacion}\n\n${details}`
                : `La compilación de la versión BASE falló.\n\nCWD: ${resolveCompilationCwd(formData.comandoCompilacion, formData.rutaProyecto, formData.rutaCompilacion) || compilationDir}\nComando: ${formData.comandoCompilacion}`)
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
      }
      
      setFormData(prev => ({ ...prev, checksumBase: checksumBaseAuto }));
      await snapshotBaseBinary(binFilePath, checksumBaseAuto);

      if (!originalVersionContent && versionFilePath) {
        try {
          const readOriginal = await window.electronAPI.readTextFile(versionFilePath);
          if (readOriginal?.ok && readOriginal.content) {
            originalVersionContent = readOriginal.content;
          }
        } catch {}
      }

      setProgressStep('📝 Actualizando versión AUMENTO en código...');
      console.log('📝 Editando archivo:', versionFilePath);
      
      const updateResult = await updateVersionInFile(versionFilePath, formData.versionAumento);
      
      if (!updateResult) {
        console.error('❌ FALLO CRÍTICO: No se pudo actualizar la versión AUMENTO en el archivo de código.');
        console.error(`   Archivo: ${versionFilePath}`);
        console.error(`   Versión a establecer: ${formData.versionAumento}`);
        console.error('   Posibles causas: Archivo locked, permisos insuficientes, patrón de versión no reconocido');
        console.warn('⚠️ Continuando de todas formas, pero la compilación usará la versión anterior del archivo...');
        setProgressStep('⚠️ ADVERTENCIA: No se actualizó versión. Compilando de todas formas...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      try {
        const checkContent = await window.electronAPI.readTextFile(versionFilePath);
        if (checkContent?.ok && checkContent.content) {
          const versionNumbers = formData.versionAumento.replace(/\./g, '[._]');
          const versionPatterns = [
            new RegExp(`"${formData.versionAumento.replace(/\./g, '\\.')}`),
            new RegExp(versionNumbers),
            new RegExp(`[A-Z_]*${versionNumbers}`)
          ];
          
          const found = versionPatterns.some(pattern => pattern.test(checkContent.content || ''));
          if (!found) {
            console.warn('⚠️ Advertencia: No se detectó la versión AUMENTO en el formato esperado. La compilación puede usar una versión diferente.');
          } else {
            console.log('✅ Versión AUMENTO verificada en el archivo');
          }
        }
      } catch (verifError) {
        console.warn('No se pudo verificar contenido de versión tras actualización:', verifError);
      }

      setProgressStep('🔨 Compilando versión AUMENTO...');
      console.log('🔍 Comando de compilación:', formData.comandoCompilacion);
      const aumentoCwd = resolveCompilationCwd(formData.comandoCompilacion, formData.rutaProyecto, formData.rutaCompilacion) || compilationDir;
      console.log('🔍 Directorio de trabajo:', aumentoCwd);
      
      const compileResult = await window.electronAPI.runCompilation(
        formData.comandoCompilacion!,
        aumentoCwd,
        stdinData
      );
      
      console.log('🔍 Resultado de compilación:', compileResult);
      
      if (!compileResult.ok) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        const details = [compileResult?.stderr, compileResult?.stdout].filter(Boolean).join('\n');
        setErrorModal({ 
          show: true, 
          title: 'Error de compilación', 
          message:
            (details?.trim()
              ? `La compilación falló.\n\nCWD: ${aumentoCwd}\nComando: ${formData.comandoCompilacion}\n\n${details}`
              : `La compilación falló.\n\nCWD: ${aumentoCwd}\nComando: ${formData.comandoCompilacion}`)
        });
        return;
      }

      setProgressStep('🔐 Calculando checksum AUMENTO...');
      const md5Aumento = await window.electronAPI.computeMd5(binFilePath);
      
      if (!md5Aumento) {
        setShowProgressModal(false);
        setIsCalculatingChecksums(false);
        setErrorModal({ show: true, title: 'Error calculando MD5', message: 'No se pudo calcular el MD5 del archivo compilado.' });
        return;
      }

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
          setChecksumWarning('Los checksums son idénticos. Realice un "clean" y compile nuevamente.');
          setCompilationDetected(false);
          setWaitingForAumentoCompile(true);
          showChecksumIdenticalError();
          startFileMonitoring();
        }, 500);
        return;
      }

      console.log('✅ MD5 AUMENTO:', md5Aumento);
      setFormData(prev => ({ ...prev, checksumAumento: md5Aumento }));

      // Paralelizar: historial ZIP + restauración versión + creación carpetas
      setProgressStep('📦 Procesando archivos y carpetas (auto)...');
      
      // Ejecutar en paralelo operaciones independientes
      console.log('🔍 Iniciando procesamiento paralelo...');
      const [historialInfo, carpetaCreada] = await Promise.all([
        // Registrar en historial y generar ZIP
        (async () => {
          console.log('🔍 Llamando a registrarAumentoEnHistorial con:', checksumBaseAuto, md5Aumento);
          const info = await registrarAumentoEnHistorial(checksumBaseAuto, md5Aumento);
          console.log('🔍 registrarAumentoEnHistorial retornó:', info);
          const result = info?.zipPath || historialZipRef.current;
          console.log('🔍 Valor final de historialInfo (zipPath):', result);
          return result;
        })(),
        // Restaurar versión BASE
        (async () => {
          try {
            if (originalVersionContent) {
              const restoreResult = await window.electronAPI.writeTextFile(versionFilePath, originalVersionContent);
              if (!restoreResult.ok) {
                console.warn('No se pudo restaurar el archivo a su estado original. Intentando fijar a version BASE...');
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

          // Crear estructura de carpetas
          return await crearEstructuraCarpetas(formData.checksumBase, md5Aumento);
        })()
      ]).catch(err => {
        console.error('Error en procesamiento paralelo:', err);
        return [null, null];
      });

      console.log('🔍 Resultados de procesamiento paralelo:');
      console.log('   historialInfo (zipPath):', historialInfo);
      console.log('   carpetaCreada:', carpetaCreada);
      
      historialZipPath = historialInfo || historialZipRef.current;
      console.log('🔍 historialZipPath asignado:', historialZipPath);
      console.log('   (historialInfo era:', historialInfo, ', historialZipRef.current era:', historialZipRef.current, ')');

      // Verificar que el ZIP existe antes de usarlo
      if (historialZipPath && window.electronAPI?.fileExists) {
        const zipExists = await window.electronAPI.fileExists(historialZipPath);
        if (zipExists) {
          console.log('✅ ZIP verificado y existe:', historialZipPath);
        } else {
          console.warn('⚠️ ZIP no existe en:', historialZipPath, '- retentando...');
          // Esperar un poco e intentar de nuevo por si aún se está escribiendo
          await new Promise(resolve => setTimeout(resolve, 500));
          const zipExistsRetry = await window.electronAPI.fileExists(historialZipPath);
          if (!zipExistsRetry) {
            console.error('❌ ZIP definitivamente no existe. El adjunto NO se enviará.');
            historialZipPath = null;
          }
        }
      }

      // Paralelizar tareas no-dependientes: captura, Release Notes y Roadmap
      await Promise.all([
        (async () => {
          if (carpetaCreada) await capturarPantalla(carpetaCreada);
        })(),
        (async () => {
          if (carpetaCreada) await generarReleaseNotes(carpetaCreada);
        })(),
        actualizarRoadmap()
      ]).catch(err => console.warn('Error en procesamiento paralelo:', err));

      let zipPathToUse = historialZipPath || undefined;
      console.log('🔍 zipPathToUse antes de verificación:', zipPathToUse);
      console.log('   historialZipPath era:', historialZipPath);
      console.log('   historialZipRef.current:', historialZipRef.current);
      
      if (zipPathToUse && window.electronAPI?.fileExists) {
        const zipExists = await window.electronAPI.fileExists(zipPathToUse);
        console.log('🔍 Primera verificación de ZIP - existe:', zipExists);
        if (!zipExists) {
          console.warn('⚠️ ZIP no existe en primera verificación. Reintentando en 1s...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const zipExistsRetry = await window.electronAPI.fileExists(zipPathToUse);
          console.log('🔍 Segunda verificación de ZIP - existe:', zipExistsRetry);
          if (!zipExistsRetry) {
            console.error('❌ ZIP definitivamente no existe. Enviando correo sin adjunto.');
            zipPathToUse = undefined;
          }
        }
      }

      console.log('🔍 zipPathToUse FINAL que se enviará a handleCreateEmail:', zipPathToUse);
      const asuntoCorreo = await handleCreateEmail(md5Aumento, zipPathToUse, checksumBaseAuto);

      setProgressStep('✅ Proceso completado - Correo creado');
      setIsCalculatingChecksums(false);
      setShowProgressModal(false);
      setCompilationDetected(true);
      
      const dataFinal: CrearVersionData = {
        ...formData,
        checksumAumento: md5Aumento
      };
      onSubmit(dataFinal);
      
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

  const handleAumentoNo = async (md5BaseParam?: string | null) => {
    
    const dataParaGuardar: CrearVersionData = {
      ...formData,
      versionAumento: undefined,
      checksumAumento: undefined
    };
    
    try {
      setShowProgressModal(true);
      setProgressStep('📦 Actualizando historial y ZIP...');
      const checksumBaseToUse = md5BaseParam || formData.checksumBase;
      const historialInfo = await registrarAumentoEnHistorial(checksumBaseToUse);
      let zipForEmail = historialInfo.zipPath || undefined;
      if (zipForEmail && window.electronAPI?.fileExists) {
        const exists = await window.electronAPI.fileExists(zipForEmail);
        if (!exists) {
          await new Promise(r => setTimeout(r, 1000));
          const existsRetry = await window.electronAPI.fileExists(zipForEmail);
          if (!existsRetry) zipForEmail = undefined;
        }
      }
      await handleCreateEmail('', zipForEmail, checksumBaseToUse || null);
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
    const isManualFinalize = waitingForAumentoCompile && !(formData.rutaProyecto && formData.archivoVersion && formData.comandoCompilacion);
    
    if (!formData.rutaCompilacion || !formData.nombreArchivoBin) {
      setErrorModal({ show: true, title: '❌ Faltan datos', message: 'Debes proporcionar la ruta de compilación y el nombre del archivo .bin' });
      return;
    }

    // Validar que la versión AUMENTO sea diferente de BASE
    if (formData.versionAumento === formData.versionBase) {
      setShowProgressModal(false);
      setIsCalculatingChecksums(false);
      setErrorModal({
        show: true,
        title: '⚠️ ADVERTENCIA: Versión no cambió',
        message: `Las versiones BASE y AUMENTO son iguales: ${formData.versionBase}\n\nEsto causará errores. Debes cambiar la versión AUMENTO a un valor diferente antes de compilar.\n\nEjemplo: BASE=2.0.0 → AUMENTO=2.1.0`
      });
      return;
    }

    setShowProgressModal(true);
    const binFilePath = `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`;
    let versionFilePath = formData.archivoVersion;
    
    if (!versionFilePath && window.electronAPI) {
      const projectRoot = formData.rutaProyecto ? normalizeWindowsSlashes(formData.rutaProyecto) : '';
      const manualEntry = formData.archivoVersion?.trim();
      const headerHintPath = artifactHints.headerPath ? normalizeWindowsSlashes(artifactHints.headerPath) : null;
      versionFilePath = await findVersionFileFast(projectRoot, manualEntry, headerHintPath) || '';
    }
    
    // En flujo manual no tocar el archivo de versión ni compilar automáticamente
    if (!isManualFinalize) {
      // PRIMERO: Actualizar versión AUMENTO en el archivo
      if (versionFilePath && formData.versionAumento) {
        setProgressStep('📝 Actualizando versión AUMENTO en código...');
        const updateResult = await updateVersionInFile(versionFilePath, formData.versionAumento);
        if (!updateResult) {
          console.warn('⚠️ No se pudo actualizar versión automáticamente.');
        } else {
          console.log('✅ Versión AUMENTO actualizada correctamente');
        }
      }
      
      // LUEGO: Si no existe el .bin, compilar automáticamente
      if (window.electronAPI?.runCompilation && formData.comandoCompilacion) {
        const binExists = await window.electronAPI.fileExists(binFilePath);
        if (!binExists) {
          console.warn('⚠️ [Manual] .bin no existe. Compilando automáticamente...');
          setProgressStep('🔨 Compilando versión AUMENTO...');
          const compilationDir = resolveCompilationCwd(formData.comandoCompilacion, formData.rutaProyecto, formData.rutaCompilacion);
          const isCompilePy = /compile\.py/i.test(formData.comandoCompilacion || '');
          const stdinData = isCompilePy ? `${formData.compilePyMode || '2'}\n${formData.compilePyTarget || '2'}\n` : undefined;
          const compileResult = await window.electronAPI.runCompilation(formData.comandoCompilacion, compilationDir, stdinData);
          if (!compileResult.ok) {
            console.error('❌ [Manual] Error compilando:', compileResult.error);
            setShowProgressModal(false);
            setIsCalculatingChecksums(false);
            const details = [compileResult?.stderr, compileResult?.stdout].filter(Boolean).join('\n');
            setErrorModal({
              show: true,
              title: 'Error compilando',
              message:
                (details?.trim()
                  ? `No se pudo compilar automáticamente.\n\nCWD: ${compilationDir}\nComando: ${formData.comandoCompilacion}\n\n${details}`
                  : `No se pudo compilar automáticamente.\n\nCWD: ${compilationDir}\nComando: ${formData.comandoCompilacion}\n\nCompila manualmente e intenta de nuevo.`)
            });
            return;
          }
          console.log('✅ [Manual] Compilado automáticamente correctamente');
        }
      }
    } else {
      console.log('🔒 Flujo manual: no se modifica archivo de versión ni se compila automáticamente');
    }
    
    setProgressStep('🔐 Calculando checksum AUMENTO...');
    setIsCalculatingChecksums(true);
    const md5Aumento = await window.electronAPI.computeMd5(binFilePath);
    
    if (!md5Aumento) {
      setShowProgressModal(false);
      setIsCalculatingChecksums(false);
      setErrorModal({ show: true, title: 'Error calculando checksum', message: 'No se pudo calcular el MD5 del archivo AUMENTO. Verifica que el archivo existe en la ruta de compilación.' });
      return;
    }

    console.log('🔍 Verificando checksums:', {
      checksumBase: formData.checksumBase?.substring(0, 12),
      md5Aumento: md5Aumento.substring(0, 12),
      sonIguales: formData.checksumBase === md5Aumento
    });

    if (formData.checksumBase === md5Aumento) {
      setShowProgressModal(false);
      setIsCalculatingChecksums(false);
      setChecksumWarning('Los checksums son idénticos. Realice un "clean" y compile nuevamente.');
      setCompilationDetected(false);
      showChecksumIdenticalError();
      await new Promise(resolve => setTimeout(resolve, 100));
      setErrorModal({
        show: true,
        title: '⚠️ Checksums Idénticos',
        message: 'El checksum BASE y AUMENTO son iguales.\n\nEsto significa que el archivo .bin no cambió después de compilar.\n\nPor favor:\n1. Verifica que hayas modificado el código\n2. Ejecuta "make clean" o limpia el proyecto\n3. Vuelve a compilar\n4. Presiona "Finalizar" cuando el archivo .bin esté actualizado'
      });
      setWaitingForAumentoCompile(true);
      startFileMonitoring();
      return;
    }
    setChecksumWarning('');

    console.log('✅ MD5 AUMENTO:', md5Aumento);
    setFormData(prev => ({ ...prev, checksumAumento: md5Aumento }));
    setProgressStep('📦 Actualizando historial y ZIP (manual)...');
    let historialInfo = await registrarAumentoEnHistorial(formData.checksumBase, md5Aumento);

    // Verificar que el ZIP exista antes de crear el correo (similar al flujo automático)
    if (historialInfo.zipPath && window.electronAPI?.fileExists) {
      const zipExists = await window.electronAPI.fileExists(historialInfo.zipPath);
      if (!zipExists) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const zipExistsRetry = await window.electronAPI.fileExists(historialInfo.zipPath);
        if (!zipExistsRetry) {
          console.warn('⚠️ ZIP no disponible para adjuntar. Se enviará sin adjunto.');
          historialInfo = { ...historialInfo, zipPath: null };
        }
      }
    }

    setProgressStep('📁 Creando estructura de carpetas (manual)...');
    await crearEstructuraCarpetas(formData.checksumBase, md5Aumento);
    
    const asuntoCorreo = await handleCreateEmail(md5Aumento, historialInfo.zipPath || undefined, formData.checksumBase);
    
    setProgressStep('✅ Proceso completado (manual)');
    setIsCalculatingChecksums(false);
    setShowProgressModal(false);
    
    const dataFinal: CrearVersionData = {
      ...formData,
      checksumAumento: md5Aumento
    };
    onSubmit(dataFinal);
    
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

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-[9998]"
            transition={{ duration: 0.2 }}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
                      disabled={isCalculatingChecksums || showProgressModal || waitingForAumentoCompile || waitingForBaseCompile}
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        (isCalculatingChecksums || showProgressModal || waitingForAumentoCompile || waitingForBaseCompile)
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                      title={(isCalculatingChecksums || showProgressModal || waitingForAumentoCompile || waitingForBaseCompile) ? "Debes completar el proceso antes de cerrar" : "Cerrar"}
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

                        <FieldGroup label="VERSIÓN – DEMO">
                          <div
                            className={cn(
                              'input-modern w-full rounded-2xl py-3 px-4 text-base min-h-[48px] flex items-center justify-between',
                              formData.esDemo ? 'border-amber-400 dark:border-amber-500' : ''
                            )}
                          >
                            <span className="text-base font-semibold text-gray-700 dark:text-gray-200">{formData.esDemo ? 'DEMO' : 'No'}</span>
                            <button
                              type="button"
                              onClick={() => handleInputChange('esDemo', !formData.esDemo)}
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
                                formData.esDemo ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                              )}
                            >
                              {formData.esDemo ? '✓ DEMO' : '✗ No'}
                            </button>
                          </div>
                        </FieldGroup>

                        <TextField
                          label="Versión Base"
                          value={formData.versionBase || ''}
                          onChange={(val) => handleInputChange('versionBase', val)}
                          onEnter={() => focusNextField('versionBase')}
                          inputRef={(el) => fieldRefs.current.versionBase = el}
                          error={errors.versionBase}
                          required={!formData.esDemo}
                          disabled={formData.esDemo}
                          placeholder="Ej: 1.0.0"
                          helper="Formato: X.Y.Z"
                        />

                        <FieldGroup label="¿Incluir versión AUMENTO?">
                          <div
                            className={cn(
                              'input-modern w-full rounded-2xl py-3 px-4 text-base min-h-[48px] flex items-center justify-between',
                              formData.esDemo ? 'opacity-80' : ''
                            )}
                          >
                            <span className="text-base font-semibold text-gray-700 dark:text-gray-200">{effectiveIncludeAumento ? 'Sí' : 'No'}</span>
                            <button
                              type="button"
                              onClick={toggleIncludeAumento}
                              disabled={formData.esDemo}
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
                                formData.esDemo
                                  ? 'opacity-60 cursor-not-allowed bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                                  : (effectiveIncludeAumento ? 'bg-green-500 text-white shadow-md' : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200')
                              )}
                            >
                              {effectiveIncludeAumento ? '✓ Sí' : '✗ No'}
                            </button>
                          </div>
                        </FieldGroup>

                        {effectiveIncludeAumento && (
                          <TextField
                            label="Versión Aumento"
                            value={formData.versionAumento || ''}
                            onChange={(val) => handleInputChange('versionAumento', val)}
                            onEnter={() => focusNextField('versionAumento')}
                            inputRef={(el) => fieldRefs.current.versionAumento = el}
                            error={errors.versionAumento}
                            required={formData.tipoDocumento === 'firma' && effectiveIncludeAumento}
                            disabled={formData.esDemo}
                            placeholder="Ej: 1.1.0"
                            helper="Formato: X.Y.Z"
                          />
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-5">
                        {/* Tipo de Firma */}
                        <FieldGroup label="Tipo de Firma" icon={<span aria-hidden>🔐</span>}>
                          <div ref={tipoFirmaRef} className="relative group" onKeyDown={(e) => { if (e.key === 'Escape') setShowTipoFirmaOptions(false); }}>
                            <button
                              type="button"
                              aria-haspopup="listbox"
                              aria-expanded={showTipoFirmaOptions}
                              onClick={() => setShowTipoFirmaOptions(v => !v)}
                              className={cn(
                                'input-modern w-full rounded-2xl py-3 px-4 text-base min-h-[48px] text-left font-semibold flex items-center justify-between',
                                'border-2 border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-500 transition-all'
                              )}
                            >
                              <span>{formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Genérica'}</span>
                              <ChevronDownIcon className={cn('h-5 w-5 text-pink-600 dark:text-pink-400 transition-transform', showTipoFirmaOptions ? 'rotate-180' : '')} />
                            </button>

                            {/* Custom dropdown list */}
                            <AnimatePresence>
                              {showTipoFirmaOptions && (
                                <motion.ul
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  role="listbox"
                                  className="absolute z-20 bottom-full mb-2 w-full overflow-hidden rounded-xl border-2 border-pink-200 dark:border-pink-700
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
                        </FieldGroup>

                        {/* CID (Customer ID) */}
                        <FieldGroup
                          label="CID (Customer ID)"
                          icon={
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                              ID
                            </span>
                          }
                        >
                          <div className="relative flex items-center">
                            {formData.tipoFirma === 'generica' ? (
                              <div className="input-modern w-full rounded-2xl py-3 px-4 !pl-14 text-base min-h-[48px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700">
                                0
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={formData.cid || ''}
                                onChange={(e) => handleInputChange('cid', e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className={cn(
                                  'input-modern w-full rounded-2xl py-3 px-4 !pl-14 text-base min-h-[48px] font-semibold',
                                  'border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500',
                                  'focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all'
                                )}
                              />
                            )}
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center pointer-events-none text-indigo-500 dark:text-indigo-400 font-bold text-lg">
                              #
                            </div>
                          </div>
                        </FieldGroup>
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
                            onFilesSelected={handleWebFolderSelect}
                            error={errors.rutaCompilacion}
                            required
                            placeholder="Ej: C:\\builds\\proyecto\\v1.0.0"
                            helper="Selecciona la carpeta raíz de tu proyecto para que la app busque scripts y binarios (web y escritorio)"
                          />

                          {/* En modo web, la detección funciona tras seleccionar carpeta */}

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
                          
                          {/* Campos manuales de checksum para modo web */}
                          {!supportsProjectLookup && (
                            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                                <span>⚠️</span>
                                Modo Web: Checksums Manuales
                              </h4>
                              <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                                En modo web, debes calcular los checksums MD5 manualmente usando herramientas como CertUtil (Windows) o md5sum (Linux/Mac) e ingresarlos aquí.
                              </p>
                              <TextField
                                label="Checksum BASE (MD5)"
                                value={formData.checksumBase || ''}
                                onChange={(val) => handleInputChange('checksumBase', val)}
                                placeholder="Ej: a1b2c3d4e5f6..."
                                helper="MD5 del archivo .bin de la versión BASE"
                              />
                              {includeAumentoCert && (
                                <div className="mt-4">
                                  <TextField
                                    label="Checksum AUMENTO (MD5)"
                                    value={formData.checksumAumento || ''}
                                    onChange={(val) => handleInputChange('checksumAumento', val)}
                                    placeholder="Ej: f6e5d4c3b2a1..."
                                    helper="MD5 del archivo .bin de la versión AUMENTO"
                                  />
                                </div>
                              )}
                            </div>
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
                            Completa estos campos para que el sistema actualice el código y compile automáticamente. Si NO incluyes AUMENTO, se compila y entrega SOLO BASE (ZIP con .bin + checksum). Si incluyes AUMENTO, se ejecuta el flujo completo.
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

                                  
                                  <div className="space-y-2 mt-6">
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

          {/* Modal de confirmación eliminado: el flujo continúa automáticamente según el toggle */}

          {/* Modal de espera para compilación BASE (DEMO) */}
          {waitingForBaseCompile && (
            <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-[10010]">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 max-w-lg mx-4 shadow-2xl border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-2xl">🔨</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{formData.esDemo ? 'Compila la Versión DEMO' : 'Compila la Versión BASE'}</h3>
                </div>

                <div className="bg-white rounded-xl p-5 mb-4 border-2 border-gray-200 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Archivo esperado</p>
                  <p className="text-sm font-mono text-gray-900 break-all select-all">
                    {formData.rutaCompilacion && formData.nombreArchivoBin
                      ? `${formData.rutaCompilacion}\\${formData.nombreArchivoBin}`
                      : '—'}
                  </p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-600 text-xl">⚠️</span>
                    <p className="font-semibold text-yellow-800">Acción requerida:</p>
                  </div>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    Debes compilar el proyecto manualmente ahora. La aplicación continuará automáticamente cuando detecte un cambio válido en el archivo <span className="font-mono font-semibold">.bin</span> y luego generará el correo en Outlook.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled
                    className="flex-1 px-6 py-3 font-medium rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="animate-pulse">⏳</span>
                    <span>Esperando compilación...</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de espera para compilación AUMENTO */}
          {waitingForAumentoCompile && (
            <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-[10010]">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 max-w-lg mx-4 shadow-2xl border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-2xl">🔨</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Compila la Versión AUMENTO</h3>
                </div>



                <div className="bg-white rounded-xl p-5 mb-4 border-2 border-gray-200 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Versión BASE</p>
                  <p className="text-3xl font-bold text-gray-900">{formData.versionBase}</p>
                </div>

                {formData.checksumBase && (
                  <div className="bg-white rounded-xl p-5 mb-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500 text-base">✓</span>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checksum BASE</p>
                    </div>
                    <p className="text-gray-800 font-mono text-sm break-all select-all bg-gray-50 rounded-lg px-3 py-2">
                      {formData.checksumBase}
                    </p>
                  </div>
                )}

                {checksumWarning ? (
                  <div className="bg-red-50 border-2 border-red-400 p-5 mb-6 rounded-xl shadow-md">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-red-600 text-2xl">❌</span>
                      <div>
                        <p className="font-bold text-red-900 text-lg mb-1">Error: Checksums idénticos</p>
                        <p className="text-sm text-red-800 leading-relaxed font-medium">
                          {checksumWarning}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs text-red-700">
                        💡 <strong>Nota:</strong> Este mensaje desaparecerá automáticamente cuando detectemos una nueva compilación válida.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-600 text-xl">⚠️</span>
                      <p className="font-semibold text-yellow-800">Acción requerida:</p>
                    </div>
                    <p className="text-sm text-yellow-800 leading-relaxed">
                      Compila el proyecto ahora (en tu IDE, VM, o WSL). Cuando el archivo <span className="font-mono font-semibold">.bin</span> esté generado, presiona <strong>"Finalizar"</strong>.
                    </p>
                  </div>
                )}

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
            <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-[10015]">
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

                  {/* Mostrar checksum BASE de forma destacada */}
                  {progressDisplay.text?.includes('Checksum BASE calculado:') ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                      <p className="text-lg font-semibold text-gray-900">Checksum BASE:</p>
                      <div className="bg-gray-50 rounded-lg p-4 w-full">
                        <p className="text-blue-600 font-mono text-sm break-all text-center select-all">
                          {formData.checksumBase || progressDisplay.text.split(': ')[1]}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900 text-center leading-relaxed">
                      {progressDisplay.text || 'Procesando...'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal de error personalizado */}
          {errorModal.show && (
            <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-[10020]">
              <div className="w-full max-w-lg mx-4 rounded-2xl bg-white dark:bg-gray-900 border border-red-200/70 dark:border-red-500/60 shadow-2xl p-6">
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
                    className="w-full px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:opacity-90 transition">
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

  return createPortal(modalContent, document.body);
}