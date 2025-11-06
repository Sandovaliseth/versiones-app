const path = require('path');
const installer = require('electron-winstaller');

const appDirectory = path.resolve(__dirname, '..', 'dist-electron', 'Gestor de Versiones-win32-x64');
const outputDirectory = path.resolve(__dirname, '..', 'dist-installer');
const exeName = 'Gestor de Versiones.exe';

console.log('Creating Windows installer (Squirrel) using electron-winstaller...');

installer.createWindowsInstaller({
  appDirectory,
  outputDirectory,
  authors: 'LIS',
  exe: exeName,
  setupExe: 'Gestor de Versiones-Setup.exe',
  noMsi: true
})
  .then(() => console.log('Installer created at:', outputDirectory))
  .catch(err => {
    console.error('Error creating installer:', err);
    process.exit(1);
  });
