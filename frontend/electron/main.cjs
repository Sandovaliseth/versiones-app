// 🖥️ Electron Main Process - Gestor de Versiones
// Proceso principal que controla el ciclo de vida de la aplicación

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const crypto = require('crypto');
const { spawn } = require('child_process');
const AdmZip = require('adm-zip');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

const ensureDirectory = async (targetPath) => {
  if (!targetPath) return;
  await fsPromises.mkdir(targetPath, { recursive: true });
};

const sanitizeFilename = (value, fallback = 'archivo') => {
  if (!value || typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_').trim();
  return cleaned.length > 0 ? cleaned.slice(0, 180) : fallback;
};

const runPowerShellJson = (payload = {}, scriptBody = '') => {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      reject(new Error('La automatización de Outlook solo está disponible en Windows.'));
      return;
    }

    const encoded = Buffer.from(JSON.stringify(payload || {}), 'utf8').toString('base64');
    const child = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', '-'], {
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => { stdout += data.toString(); });
    child.stderr.on('data', data => { stderr += data.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `PowerShell salió con código ${code}`));
        return;
      }

      const trimmed = stdout.trim();
      if (!trimmed) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(trimmed));
      } catch (error) {
        reject(new Error(`No se pudo parsear la respuesta de PowerShell: ${error.message}. Respuesta: ${trimmed}`));
      }
    });

    const script = `
$ErrorActionPreference = 'Stop'
$payload = "${encoded}"
$payloadJson = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload))
if ([string]::IsNullOrWhiteSpace($payloadJson)) { $data = @{} } else { $data = $payloadJson | ConvertFrom-Json }
${scriptBody}
`;

    child.stdin.end(script);
  });
};

// Evitar múltiples instancias: si ya hay una, traer esa ventana y salir
const gotTheLock = app.requestSingleInstanceLock && app.requestSingleInstanceLock();
if (gotTheLock === false) {
  app.quit();
} else if (gotTheLock) {
  app.on('second-instance', () => {
    // Cuando se intente abrir una segunda instancia, restaurar/focar la existente
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Crear la ventana principal de la aplicación
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#f9fafb', // Mismo color de fondo que la app web
    icon: path.join(__dirname, 'icon.png'), // Icono de la aplicación
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, // Seguridad: aislar contextos
      nodeIntegration: false, // Seguridad: no exponer Node.js directamente
      sandbox: false, // Deshabilitado: sandbox causa problemas de renderer en Windows
    },
    show: false, // No mostrar hasta que esté lista
    frame: true, // Mantener frame nativo del SO
    titleBarStyle: 'default',
    autoHideMenuBar: false // Asegurar que el menú del sistema sea visible
  });

  // En desarrollo: cargar desde servidor Vite
  // En producción: cargar archivos compilados
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const candidates = [
      path.join(__dirname, '../dist/index.html'),
      path.join(process.resourcesPath || '', 'app', 'dist', 'index.html'),
      path.join(process.resourcesPath || '', 'dist', 'index.html'),
      path.join(app.getAppPath(), 'dist', 'index.html')
    ].filter(Boolean);

    let loaded = false;
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          console.log('📄 Cargando index.html desde:', candidate);
          mainWindow.loadFile(candidate);
          loaded = true;
          break;
        } else {
          console.log('⚠️ No existe index.html en:', candidate);
        }
      } catch (e) {
        console.warn('⚠️ Error verificando ruta:', candidate, e.message);
      }
    }

    if (!loaded) {
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Error</title></head>
        <body style="font-family:system-ui;padding:24px;">
          <h2>❌ No se encontró index.html</h2>
          <p>Se intentaron las siguientes rutas:</p>
          <ul>${candidates.map(c => `<li>${c}</li>`).join('')}</ul>
          <p>Verifica que el comando <code>npm run build</code> haya generado la carpeta <code>dist</code> y que esté incluida en el paquete.</p>
        </body></html>`;
      mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    }
  }

  // Mostrar ventana cuando esté lista para evitar flash blanco
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    // En algunas instalaciones de Windows, el menú puede ocultarse; forzar visibilidad
    try { mainWindow.setMenuBarVisibility(true); } catch (e) { /* ignore */ }
    // Opcional: abrir DevTools si hay problemas de carga
    try { if (!isDev) { /* mainWindow.webContents.openDevTools(); */ } } catch (e) { /* ignore */ }
  });

  // Timeout de seguridad: si no se muestra en 3s, forzar mostrar
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('Forcing window to show after timeout');
      mainWindow.show();
      mainWindow.focus();
    }
  }, 3000);

  // Cerrar referencia cuando se cierra la ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevenir navegación externa (seguridad)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Solo permitir navegación en localhost en desarrollo
    if (isDev && url.startsWith('http://localhost:5173')) {
      return;
    }
    // En producción, solo permitir file://
    if (!isDev && url.startsWith('file://')) {
      return;
    }
    event.preventDefault();
  });

  // Prevenir abrir nuevas ventanas (seguridad)
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}

// Crear ventana cuando Electron esté listo
app.whenReady().then(() => {
  createWindow();

  // En macOS, recrear ventana si se hace clic en el dock y no hay ventanas
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Salir cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers - Comunicación con el renderer process
// Aquí puedes agregar handlers para funcionalidades nativas del SO

// Ejemplo: Obtener información del sistema
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('file-exists', async (_event, targetPath) => {
  if (!targetPath) return false;
  try {
    await fsPromises.access(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('read-text-file', async (_event, targetPath) => {
  try {
    if (!targetPath) return { ok: false, error: 'Ruta no especificada' };
    const content = await fsPromises.readFile(targetPath, 'utf8');
    return { ok: true, content };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

ipcMain.handle('write-text-file', async (_event, targetPath, content = '') => {
  try {
    if (!targetPath) return { ok: false, error: 'Ruta no especificada' };
    await ensureDirectory(path.dirname(targetPath));
    await fsPromises.writeFile(targetPath, content, 'utf8');
    return { ok: true, path: targetPath };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

ipcMain.handle('create-directory', async (_event, dirPath) => {
  try {
    if (!dirPath) return { ok: false, error: 'Ruta no especificada' };
    await ensureDirectory(dirPath);
    return { ok: true, path: dirPath };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

ipcMain.handle('copy-file', async (_event, src, dest) => {
  try {
    if (!src || !dest) return { ok: false, error: 'Ruta origen/destino requerida' };
    await ensureDirectory(path.dirname(dest));
    await fsPromises.copyFile(src, dest);
    return { ok: true, path: dest };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

ipcMain.handle('compute-md5', async (_event, filePath) => {
  if (!filePath) return '';
  try {
    await fsPromises.access(filePath, fs.constants.F_OK);
  } catch {
    return '';
  }

  return await new Promise((resolve) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('error', () => resolve(''));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
});

ipcMain.handle('get-file-stat', async (_event, targetPath) => {
  if (!targetPath) return { ok: false };
  try {
    const s = fs.statSync(targetPath);
    return { ok: true, mtimeMs: s.mtimeMs, size: s.size };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle('capture-screenshot', async (_event, options = {}) => {
  try {
    if (!mainWindow) return { ok: false, error: 'Ventana principal no disponible' };
    const outputPath = options.outputPath;
    if (!outputPath) return { ok: false, error: 'Debes proporcionar outputPath' };
    const image = await mainWindow.webContents.capturePage();
    await ensureDirectory(path.dirname(outputPath));
    await fsPromises.writeFile(outputPath, image.toPNG());
    return { ok: true, path: outputPath };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

ipcMain.handle('run-compilation', async (_event, command, cwd, stdinData) => {
  if (!command || typeof command !== 'string') {
    return { ok: false, error: 'Comando no proporcionado' };
  }

  return await new Promise((resolve) => {
    const child = spawn(command, {
      cwd: cwd && cwd.trim() ? cwd : undefined,
      shell: true,
      windowsHide: true,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    if (stdinData) {
      child.stdin.write(stdinData);
      child.stdin.end();
    }

    child.stdout.on('data', (data) => stdout += data.toString());
    child.stderr.on('data', (data) => stderr += data.toString());
    child.on('error', (error) => resolve({ ok: false, error: String(error) }));
    child.on('close', (code) => {
      resolve({ ok: code === 0, code, stdout, stderr });
    });
  });
});

ipcMain.handle('create-outlook-draft', async (_event, options = {}) => {
  try {
    const result = await runPowerShellJson(options, `
$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")
$mail = $outlook.CreateItem(0)
if ($data.subject) { $mail.Subject = $data.subject }
if ($data.body) { $mail.HTMLBody = $data.body }
if ($data.to) { $mail.To = $data.to }
if ($data.saveToSent -eq $true) {
  $mail.SaveSentMessageFolder = $namespace.GetDefaultFolder(5)
}
$attachedCount = 0
if ($data.attachments) {
  foreach ($att in $data.attachments) {
    if ($att -and (Test-Path $att)) {
      $mail.Attachments.Add($att) | Out-Null
      $attachedCount++
    }
  }
}
if ($data.send -eq $true) {
  $mail.Send() | Out-Null
  $sent = $true
} else {
  if ($data.silent -ne $true) {
    $mail.Display() | Out-Null
  }
  $mail.Save() | Out-Null
  $sent = $false
}
$result = [PSCustomObject]@{
  ok = $true
  subject = $mail.Subject
  sent = $sent
  entryId = $mail.EntryID
  attachedCount = $attachedCount
}
$result | ConvertTo-Json -Compress
`);

    return result || { ok: false, error: 'Sin respuesta de Outlook' };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

// Entregar una ruta base confiable para 'Versiones'
ipcMain.handle('get-default-versiones-path', async () => {
  try {
    const os = require('os');
    const home = os.homedir();
    const candidates = [
      path.join(home, 'OneDrive', 'Versiones'),
      path.join(home, 'Documents', 'Versiones')
    ];
    // Elegir el primer candidato; crear si no existe
    const base = candidates[0];
    await ensureDirectory(base);
    return base;
  } catch (e) {
    // Fallback al temp
    const baseTemp = path.join(app.getPath('temp'), 'versiones-app', 'Versiones');
    try { await ensureDirectory(baseTemp); } catch {}
    return baseTemp;
  }
});

ipcMain.handle('check-outlook-replies', async (_event, options = {}) => {
  try {
    const result = await runPowerShellJson(options, `
$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")
$inbox = $namespace.GetDefaultFolder(6)
$items = $inbox.Items
$items.Sort("ReceivedTime", $false)
$minutes = if ($data.sinceMinutes) { [int]$data.sinceMinutes } else { 1440 }
$cutoff = (Get-Date).AddMinutes(-1 * $minutes)
$matches = @()
foreach ($item in $items) {
  if ($null -eq $item) { continue }
  if ($item.ReceivedTime -lt $cutoff) { break }
  $subjectKeyword = $data.subjectKeyword
  if ($subjectKeyword -and ($item.Subject -notlike "*${'$'}subjectKeyword*")) { continue }
  $matches += [PSCustomObject]@{
    subject = $item.Subject
    body = $item.Body
    from = $item.SenderName
    receivedTime = ($item.ReceivedTime).ToString('s')
  }
  if ($matches.Count -ge 25) { break }
}
$result = [PSCustomObject]@{
  ok = $true
  count = $matches.Count
  replies = $matches
}
$result | ConvertTo-Json -Compress
`);

    return result || { ok: true, count: 0, replies: [] };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

// Buscar archivos recursivamente en una carpeta (limitado a evitar búsquedas infinitas)
ipcMain.handle('find-files', async (event, rootPath, patterns = []) => {
  const matches = [];
  const maxEntries = 20000; // safety limit
  let entriesScanned = 0;

  const isMatch = (name) => {
    for (const p of patterns) {
      if (!p) continue;
      if (p.startsWith('.')) {
        if (name.toLowerCase().endsWith(p.toLowerCase())) return true;
      } else {
        if (name.toLowerCase() === p.toLowerCase()) return true;
      }
    }
    return false;
  };

  const queue = [rootPath];
  try {
    while (queue.length > 0) {
      const cur = queue.shift();
      if (!cur) continue;
      let dirents;
      try {
        dirents = fs.readdirSync(cur, { withFileTypes: true });
      } catch (e) {
        continue;
      }

      for (const d of dirents) {
        entriesScanned++;
        if (entriesScanned > maxEntries) return { ok: false, error: 'Límite de búsqueda alcanzado', matches };
        const full = path.join(cur, d.name);
        if (d.isDirectory()) {
          // skip node_modules, .git, build output folders for speed
          if (['node_modules', '.git', 'dist', 'build', 'out'].includes(d.name)) continue;
          queue.push(full);
        } else if (d.isFile()) {
          if (isMatch(d.name)) {
            matches.push(full);
          }
        }
      }
    }

    return { ok: true, matches };
  } catch (error) {
    return { ok: false, error: String(error), matches };
  }
});

// Heurística para encontrar archivos con definiciones de versión (#define VERSION, etc.)
ipcMain.handle('find-version-file', async (event, rootPath, options = {}) => {
  try {
    if (!rootPath) return { ok: false, error: 'Ruta no proporcionada' };
    if (!fs.existsSync(rootPath)) return { ok: false, error: 'La ruta indicada no existe' };
    const stat = fs.statSync(rootPath);
    if (!stat.isDirectory()) return { ok: false, error: 'La ruta debe ser una carpeta' };

    const {
      hintFile,
      versionBase,
      nombreVersionCliente
    } = options || {};
    const hintFileBase = hintFile ? path.basename(hintFile).toLowerCase() : null;

    const normalizeText = (value = '') => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const buildClientVariants = (value) => {
      if (!value) return [];
      const normalized = normalizeText(value);
      const collapsed = normalized.replace(/[^a-z0-9]+/g, ' ').trim();
      const noSpaces = collapsed.replace(/\s+/g, '');
      const underscore = collapsed.replace(/\s+/g, '_');
      const hyphen = collapsed.replace(/\s+/g, '-');
      return Array.from(new Set([normalized, collapsed, noSpaces, underscore, hyphen].filter(Boolean)));
    };

    const buildVersionVariants = (value) => {
      if (!value) return [];
      const trimmed = value.trim();
      const normalized = trimmed.toLowerCase();
      const underscored = trimmed.replace(/\./g, '_');
      const hyphenated = trimmed.replace(/\./g, '-');
      const collapsed = trimmed.replace(/\./g, '');
      return Array.from(new Set([
        trimmed,
        normalized,
        underscored,
        hyphenated,
        collapsed
      ].filter(Boolean)));
    };

    const clientVariants = buildClientVariants(nombreVersionCliente);
    const versionVariants = buildVersionVariants(versionBase);
    const specialPhrases = ['nombre version cliente', 'nombre versión cliente', 'nombre de la version cliente'];

    const ignoredDirs = new Set(['.git', '.svn', '.hg', '.idea', 'node_modules', 'dist', 'build', 'out', 'target', 'bin', 'obj', 'vendor', 'coverage', '.gradle']);
    const preferredNames = new Set([
      'appdef.h', 'appdefs.h', 'appdef.hpp', 'version.h', 'version.hpp', 'version.hh', 'versioninfo.h',
      'versions.h', 'versions.hpp', 'config_version.h', 'mainver.h', 'ver.h', 'app_version.h', 'build.h',
      'version.txt', 'version.ini', 'version.cfg'
    ]);
    const allowedExtensions = ['.h', '.hpp', '.hh', '.hxx', '.c', '.cpp', '.cxx', '.ino', '.txt', '.cfg', '.ini', '.json', '.rc'];
    const maxEntries = 20000;
    const maxFileSize = 512 * 1024; // 512 KB
    let entriesScanned = 0;
    let bestMatch = null;

    const readChunk = (fullPath) => {
      try {
        const fd = fs.openSync(fullPath, 'r');
        const buffer = Buffer.alloc(64 * 1024);
        const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
        fs.closeSync(fd);
        return buffer.toString('utf8', 0, bytes);
      } catch (error) {
        console.warn('⚠️ No se pudo leer archivo para análisis:', fullPath, error.message);
        return '';
      }
    };

    const evaluateFile = (fullPath, reasonPrefix = '') => {
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch {
        return;
      }
      if (!stats.isFile() || stats.size > maxFileSize) return;

      const content = readChunk(fullPath);
      if (!content) return;

      let score = 0;
      const reasons = [];
      const normalizedContent = normalizeText(content);

      const hasSpecialPhrase = specialPhrases.some(phrase => normalizedContent.includes(phrase));
      if (hasSpecialPhrase) {
        score += 1;
        reasons.push('Incluye texto "Nombre versión cliente"');
      }

      if (clientVariants.length && clientVariants.some(token => token && normalizedContent.includes(token))) {
        score += 3;
        reasons.push('Coincide con nombre de cliente/versión');
      }

      if (versionVariants.length && versionVariants.some(token => token && normalizedContent.includes(token.toLowerCase()))) {
        score += 2;
        reasons.push('Incluye número de versión detectado');
      }

      if (/#define\s+VERSION\b/i.test(content)) {
        score += 6;
        reasons.push('#define VERSION');
      }
      if (/#define\s+\w*(?:MAJOR|MINOR|PATCH)\b/i.test(content)) {
        score += 3;
        reasons.push('Define MAJOR/MINOR/PATCH');
      }
      if (/VERSION[_A-Z0-9]*\s+"[^"]+"/i.test(content)) {
        score += 2;
        reasons.push('Constante VERSION en string');
      }
      if (/#define\s+\w+\s+"\d{8}"/i.test(content)) {
        score += 1;
        reasons.push('Fecha en #define');
      }
      const defineRegex = /#define\s+([A-Za-z0-9_]+)\s+([^\r\n]+)/g;
      let defineMatch;
      let bestDefine = null;

      while ((defineMatch = defineRegex.exec(content)) !== null) {
        const varName = defineMatch[1];
        const valueRaw = defineMatch[2].trim();
        const varNameLower = normalizeText(varName);
        const valueLower = normalizeText(valueRaw);
        let localScore = 0;
        const localReasons = [];

        if (/(?:^|_)(?:ver|vers|version|vrs)(?:_|$)/i.test(varName)) {
          localScore += 3;
          localReasons.push(`Variable ${varName} contiene prefijo VER`);
        }

        if (/version/i.test(valueRaw) || /ver/i.test(valueRaw)) {
          localScore += 1;
          localReasons.push('Valor textual menciona version/ver');
        }

        if (/\d+\.\d+(?:\.\d+)?/.test(valueRaw)) {
          localScore += 3;
          localReasons.push('Valor con formato X.Y.Z');
        }

        if (/\d+_\d+(?:_\d+)?/.test(valueRaw)) {
          localScore += 2;
          localReasons.push('Valor con formato X_Y_Z');
        }

        if (versionVariants.some(token => token && valueRaw.toLowerCase().includes(token.toLowerCase()))) {
          localScore += 2;
          localReasons.push('Coincide con número de versión ingresado');
        }

        if (clientVariants.length && clientVariants.some(token => token && (varNameLower.includes(token) || valueLower.includes(token)))) {
          localScore += 2;
          localReasons.push('Relacionada con nombre de cliente/versión');
        }

        if (/fecha|date/i.test(varName)) {
          localScore += 1;
          localReasons.push('Marca de fecha de build');
        }

        if (localScore > 0 && (!bestDefine || localScore > bestDefine.score)) {
          bestDefine = {
            score: localScore,
            reason: `#define ${varName}: ${localReasons.join(' · ')}`
          };
        }
      }

      if (bestDefine) {
        score += bestDefine.score;
        reasons.push(bestDefine.reason);
      }

      if (score <= 0) return;

      const reason = [reasonPrefix, ...reasons].filter(Boolean).join(' · ');
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { path: fullPath, score, reason: reason || 'Coincidencia genérica' };
      }
    };

    const inspectCandidate = (fullPath, reasonPrefix) => {
      const name = path.basename(fullPath).toLowerCase();
      if (preferredNames.has(name)) {
        evaluateFile(fullPath, reasonPrefix || 'Nombre coincide con patrón común');
      } else {
        evaluateFile(fullPath, reasonPrefix);
      }
    };

    // Primero, intentar con hint explícito si se proporcionó
    if (hintFile) {
      const normalizedHint = hintFile.replace(/[\\/]+/g, path.sep);
      const hintCandidates = [];
      if (path.isAbsolute(normalizedHint)) hintCandidates.push(normalizedHint);
      hintCandidates.push(path.join(rootPath, normalizedHint));
      hintCandidates.push(path.join(rootPath, path.basename(normalizedHint)));

      for (const candidate of hintCandidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          inspectCandidate(candidate, 'Coincide con pista proporcionada');
          if (bestMatch) {
            return { ok: true, path: bestMatch.path, score: bestMatch.score, reason: bestMatch.reason };
          }
        }
      }
    }

    const queue = [rootPath];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      let dirents;
      try {
        dirents = fs.readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of dirents) {
        entriesScanned++;
        if (entriesScanned > maxEntries) {
          return { ok: false, error: 'Límite de búsqueda alcanzado', reason: `Se analizaron más de ${maxEntries} entradas` };
        }

        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (ignoredDirs.has(entry.name)) continue;
          queue.push(full);
          continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        const lowerName = entry.name.toLowerCase();
        if (hintFileBase && lowerName === hintFileBase) {
          inspectCandidate(full, 'Coincide exactamente con el nombre indicado');
          if (bestMatch) {
            return { ok: true, path: bestMatch.path, score: bestMatch.score, reason: bestMatch.reason };
          }
        }
        if (!preferredNames.has(lowerName) && !allowedExtensions.includes(ext)) {
          continue;
        }

        inspectCandidate(full);
      }
    }

    if (bestMatch) {
      return { ok: true, path: bestMatch.path, score: bestMatch.score, reason: bestMatch.reason };
    }

    return { ok: false, reason: 'No se encontró un archivo con definiciones de versión' };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

ipcMain.handle('zip-artifacts', async (_event, payload = {}) => {
  try {
    const { files, zipName, subfolder } = payload || {};
    const candidateFiles = Array.isArray(files) ? files.filter(Boolean) : [];
    if (!candidateFiles.length) {
      return { ok: false, error: 'No se proporcionaron archivos a comprimir' };
    }

    // Aceptar tanto archivos como carpetas; se agrega el contenido de carpetas recursivamente
    const existingPaths = candidateFiles.filter((filePath) => {
      try {
        return fs.existsSync(filePath);
      } catch {
        return false;
      }
    });

    if (!existingPaths.length) {
      return { ok: false, error: 'Ninguna de las rutas existe físicamente' };
    }

    const baseTemp = path.join(app.getPath('temp'), 'versiones-app', subfolder ? sanitizeFilename(subfolder) : '');
    await ensureDirectory(baseTemp);
    const targetName = sanitizeFilename(zipName || path.basename(existingPaths[0]) || `artefactos-${Date.now()}`);
    const zipPath = path.join(baseTemp, targetName.endsWith('.zip') ? targetName : `${targetName}.zip`);

    const zip = new AdmZip();
    for (const inputPath of existingPaths) {
      try {
        const st = fs.statSync(inputPath);
        if (st.isDirectory()) {
          // Preservar el nombre de la carpeta en el ZIP y agregar su contenido recursivamente
          zip.addLocalFolder(inputPath, path.basename(inputPath));
        } else if (st.isFile()) {
          zip.addLocalFile(inputPath, '', path.basename(inputPath));
        }
      } catch (e) {
        // Ignorar rutas problemáticas y continuar con las demás
      }
    }
    zip.writeZip(zipPath);

    return { ok: true, path: zipPath, files: existingPaths };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

// File watchers: allow renderer to request a watcher and receive events
const fileWatchers = new Map();
let fileWatchIdCounter = 1;

ipcMain.handle('start-file-watch', async (event, targetPath) => {
  if (!targetPath) return { ok: false, error: 'Ruta no especificada' };
  try {
    const id = `fw_${Date.now()}_${fileWatchIdCounter++}`;
    // Decide whether to watch the parent directory (safer) or the path directly
    let watchTarget = targetPath;
    let watchedIsDir = false;
    try {
      const st = fs.statSync(targetPath);
      if (st.isFile()) {
        watchTarget = path.dirname(targetPath);
        watchedIsDir = true;
      }
    } catch (e) {
      // If stat fails, fall back to watching the parent directory
      try {
        watchTarget = path.dirname(targetPath);
        watchedIsDir = true;
      } catch (err) {
        // fallback to targetPath as-is
        watchTarget = targetPath;
      }
    }

    // Crear watcher sobre la carpeta/archivo según corresponda
    let watcher;
    try {
      watcher = fs.watch(watchTarget, { persistent: false }, (evtType, filename) => {
        try {
          // Resolve full path when possible
          const eventPath = filename ? path.join(watchTarget, filename) : watchTarget;
          // If we watched the directory, filter events to the requested file
          if (watchedIsDir) {
            const targetBase = path.basename(targetPath);
            if (!filename || filename !== targetBase) return;
          }
          event.sender.send('file-watch-event', { watchId: id, path: eventPath, event: evtType || 'change', timestamp: Date.now() });
        } catch (e) {
          // ignore send errors
        }
      });
    } catch (watchErr) {
      // If creating watcher fails (permissions, EPERM), return error without throwing
      return { ok: false, error: String(watchErr) };
    }

    // Attach error handler so watcher internal errors don't crash main process
    watcher.on('error', (err) => {
      try {
        event.sender.send('file-watch-error', { watchId: id, path: watchTarget, error: String(err) });
      } catch (e) { /* ignore */ }
      try { watcher.close(); } catch (e) { /* ignore */ }
      fileWatchers.delete(id);
    });

    fileWatchers.set(id, watcher);
    return { ok: true, watchId: id };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

ipcMain.handle('stop-file-watch', async (_event, watchId) => {
  try {
    if (!watchId) return { ok: false, error: 'watchId requerido' };
    const w = fileWatchers.get(watchId);
    if (w) {
      try { w.close(); } catch (e) { /* ignore */ }
      fileWatchers.delete(watchId);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

// Ejemplo: Manejo de archivos (si lo necesitas en el futuro)
ipcMain.handle('open-file-dialog', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Documentos', extensions: ['pdf', 'doc', 'docx'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });
  return result.filePaths;
});

// Log de inicio
console.log('🚀 Gestor de Versiones - Electron iniciado');
console.log(`📍 Modo: ${isDev ? 'Desarrollo' : 'Producción'}`);
console.log(`💻 Plataforma: ${process.platform}`);
console.log(`📦 Versión de Electron: ${process.versions.electron}`);
console.log(`🌐 Versión de Chrome: ${process.versions.chrome}`);
console.log(`📡 Versión de Node: ${process.versions.node}`);
