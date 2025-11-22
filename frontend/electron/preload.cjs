// 🔒 Electron Preload Script - Puente Seguro
// Este script actúa como puente entre el renderer process (React) y el main process (Electron)
// Expone APIs de forma segura usando contextBridge

const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Información de la aplicación
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Manejo de archivos
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  writeTextFile: (filePath, content) => ipcRenderer.invoke('write-text-file', filePath, content),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  copyFile: (src, dest) => ipcRenderer.invoke('copy-file', src, dest),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  // Buscar archivos dentro de una carpeta (por ejemplo: compile.py, .bin)
  findFiles: (rootPath, patterns) => ipcRenderer.invoke('find-files', rootPath, patterns),
  findVersionFile: (rootPath, options) => ipcRenderer.invoke('find-version-file', rootPath, options),
  computeMd5: (filePath) => ipcRenderer.invoke('compute-md5', filePath),
  captureScreenshot: (options) => ipcRenderer.invoke('capture-screenshot', options),
  runCompilation: (command, cwd, stdinData) => ipcRenderer.invoke('run-compilation', command, cwd, stdinData),
  zipArtifacts: (options) => ipcRenderer.invoke('zip-artifacts', options),
  createOutlookDraft: (options) => ipcRenderer.invoke('create-outlook-draft', options),
  checkOutlookReplies: (options) => ipcRenderer.invoke('check-outlook-replies', options),
  
  // Puedes agregar más funcionalidades aquí según necesites
  // Por ejemplo: acceso a sistema de archivos, notificaciones del SO, etc.
  
  // Indicador de que estamos en Electron (para detectar en React)
  isElectron: true,
});

// Log de seguridad
console.log('🔒 Preload script cargado correctamente');
console.log('✅ Context Bridge inicializado');
