import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome
  },
  isElectron: true,

  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  checkOllama: () => ipcRenderer.invoke('check-ollama'),
  startOllama: () => ipcRenderer.invoke('start-ollama'),
  getScreenshot: () => ipcRenderer.invoke('GET_SCREENSHOT'),
  readExternalFile: (filename) => ipcRenderer.invoke('READ_EXTERNAL_FILE', filename),
  analyzeCode: (code) => ipcRenderer.invoke('analyze-code', code),

  onServerStatus: (callback) => ipcRenderer.on('server-status', callback),
  onOllamaStatus: (callback) => ipcRenderer.on('ollama-status', callback)
});
