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
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  
  // Puedes agregar más funcionalidades aquí según necesites
  // Por ejemplo: acceso a sistema de archivos, notificaciones del SO, etc.
  
  // Indicador de que estamos en Electron (para detectar en React)
  isElectron: true,
});

// Log de seguridad
console.log('🔒 Preload script cargado correctamente');
console.log('✅ Context Bridge inicializado');
