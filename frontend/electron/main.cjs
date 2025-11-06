// 🖥️ Electron Main Process - Gestor de Versiones
// Proceso principal que controla el ciclo de vida de la aplicación

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

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
  });

  // En desarrollo: cargar desde servidor Vite
  // En producción: cargar archivos compilados
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Abrir DevTools en desarrollo
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    // Abrir DevTools también en producción para debug
    mainWindow.webContents.openDevTools();
  }

  // Mostrar ventana cuando esté lista para evitar flash blanco
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
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
