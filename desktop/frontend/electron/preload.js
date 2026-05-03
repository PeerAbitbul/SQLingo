const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('set-always-on-top', flag),
  setStartPosition: (position) => ipcRenderer.invoke('set-start-position', position),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Auth callback listener
  onAuthCallback: (callback) => {
    ipcRenderer.on('auth-callback', (event, data) => callback(data));
  },

  // Backend port configuration
  readPortConfig: () => ipcRenderer.invoke('read-port-config'),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, data) => callback(data));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, data) => callback(data));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, data) => callback(data));
  },

  // Diagnostics
  readLogFile: () => ipcRenderer.invoke('read-log-file'),
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),

  // Platform info
  platform: process.platform,
  isElectron: true
});

console.log('✅ Electron preload script loaded');

