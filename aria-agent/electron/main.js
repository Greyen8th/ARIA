import { app, BrowserWindow, shell, dialog, Menu, Tray, nativeImage, desktopCapturer, ipcMain, systemPreferences } from 'electron';
import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let serverProcess = null;
let tray = null;
let isQuitting = false;

const PORT = 3847;
const SERVER_URL = `http://localhost:${PORT}`;
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getResourcePath(...paths) {
  if (isDev) {
    return path.join(__dirname, '..', ...paths);
  }
  return path.join(process.resourcesPath, ...paths);
}

// --- REMOVED OLLAMA FUNCTIONS ---

async function startServer() {
  // Return immediately to not block UI
  // The server process will start in the background
  const env = {
    ...process.env,
    PORT: PORT.toString(),
    NODE_ENV: isDev ? 'development' : 'production'
  };

  if (isDev) {
    const serverPath = path.join(__dirname, '..', 'src', 'server.ts');
    const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');
    
    console.log('Starting Development Server:', tsxPath, serverPath);

    serverProcess = spawn(tsxPath, [serverPath], {
      cwd: path.join(__dirname, '..'),
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } else {
    // Production: Run bundled server using Electron's internal Node
    const serverPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'server-bundle.js');
    console.log('Starting Production Server:', serverPath);
    
    if (!fs.existsSync(serverPath)) {
       console.log('Unpacked server not found, trying inside ASAR...');
       const asarServerPath = path.join(__dirname, '..', 'dist', 'server-bundle.js');
       
       serverProcess = spawn(process.execPath, [asarServerPath], {
        env: { ...env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } else {
       serverProcess = spawn(process.execPath, [serverPath], {
        env: { ...env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: ['pipe', 'pipe', 'pipe']
      });
    }
  }

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[Server]', output);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('[Server Error]', data.toString());
  });

  serverProcess.on('error', (err) => {
    console.error('[Server Process Error]', err);
  });

  serverProcess.on('exit', (code) => {
    console.log('[Server] Process exited with code:', code);
    // Don't restart if it exited successfully (0) or if we are quitting
    if (!isQuitting && code !== 0 && code !== null) {
      console.log('[Server] Restarting server in 2s...');
      setTimeout(() => startServer(), 2000);
    }
  });
}

function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true); // Port is in use
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.close();
        resolve(false);
      })
      .listen(port);
  });
}

function createWindow() {
  console.log('[BOOT] Creating Main Window...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#00000000', // Transparent for vibrancy
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    vibrancy: 'under-window', // macOS Glass Effect
    visualEffectState: 'active',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      scrollBounce: true
    },
    show: false // Wait for ready-to-show
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[BOOT] Renderer Loaded (did-finish-load)');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[BOOT ERROR] Renderer Failed to Load:', errorCode, errorDescription);
  });

  if (isDev) {
    console.log('[BOOT] Loading Loading Screen (Dev Mode)...');
    mainWindow.loadFile(path.join(__dirname, 'loading.html'));
    
    // Poll for Vite Dev Server
    const checkVite = setInterval(() => {
        // In ESM module (Electron type: module), we cannot use require directly for built-ins if not defined,
        // but we can import 'http' at the top or use fetch. 
        // Since this is node env, let's use global fetch or import.
        fetch(VITE_DEV_SERVER_URL)
            .then(res => {
                if (res.ok) {
                    clearInterval(checkVite);
                    console.log('[BOOT] Vite Dev Server Ready! Switching...');
                    mainWindow.loadURL(VITE_DEV_SERVER_URL);
                }
            })
            .catch(() => {
                console.log('[BOOT] Waiting for Vite...');
            });
    }, 500);
    
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'frontend', 'index.html');
    console.log('[BOOT] Loading Production UI from:', indexPath);
    
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[BOOT ERROR] Failed to load index.html:', err);
      mainWindow.loadURL(SERVER_URL);
    });
  }

  mainWindow.once('ready-to-show', () => {
    console.log('[BOOT] Window Ready to Show');
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'build', 'tray-icon.png');

  let icon;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open ARIA',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit ARIA',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('ARIA - AI Agent');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

function createMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'ARIA Documentation',
          click: () => shell.openExternal('https://github.com/aria-agent')
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function checkPermissions() {
    if (process.platform === 'darwin') {
        const isTrusted = systemPreferences.isTrustedAccessibilityClient(false);
        if (!isTrusted) {
            console.warn('⚠️ Accessibility Permissions Missing!');
        } else {
            console.log('✅ Accessibility Permissions Granted');
        }
    }
}

app.whenReady().then(async () => {
  createMenu();
  checkPermissions();
  
  // FORCE DOCK ICON (macOS)
  if (process.platform === 'darwin') {
    try {
      const iconPath = path.join(__dirname, '..', 'build', 'icon.icns');
      app.dock.setIcon(iconPath);
    } catch (e) {
      console.error('Failed to set dock icon:', e);
    }
  }

  // INSTANT LAUNCH: Start server and window in parallel
  startServer(); // Non-blocking now
  createWindow();
  createTray();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

ipcMain.handle('GET_SCREENSHOT', async () => {
  try {
    const sources = await desktopCapturer.getSources({ 
      types: ['screen'], 
      thumbnailSize: { width: 1920, height: 1080 } 
    });
    const primarySource = sources[0];
    if (primarySource) {
      return primarySource.thumbnail.toDataURL();
    }
    return null;
  } catch (error) {
    console.error('Screenshot failed:', error);
    throw error;
  }
});

ipcMain.handle('READ_EXTERNAL_FILE', async (event, filename) => {
    if (!filename || typeof filename !== 'string') return null;
    const safeFilename = path.basename(filename); 
    if (safeFilename !== filename) return null;
    const appData = app.getPath('userData');
    const liveLayerPath = path.join(appData, 'live-layer', safeFilename);
    try {
        if (fs.existsSync(liveLayerPath)) {
            return fs.readFileSync(liveLayerPath, 'utf-8');
        }
    } catch (e) {
        console.error(`Failed to read external file ${liveLayerPath}:`, e);
    }
    return null;
});

// --- AI TASK PROXY ---
// The Renderer calls this IPC, which then needs to talk to the Server/Brain
// Since Main process cannot easily call Server process functions directly (IPC vs HTTP),
// we will just proxy this to the server via HTTP for simplicity, or 
// acknowledge that the UI should call the WebSocket directly.
//
// However, per requirement "TASK 2: MAPPATURA UI -> BACKEND", we implement the handler.
// Since the Brain is in the Server Process, Main Process acts as a bridge if needed.
// But for "Analyze Code", it is cleaner if UI sends it to WebSocket.
// 
// To satisfy the specific request "main.ts deve ascoltare analyze-code":
ipcMain.handle('analyze-code', async (event, code) => {
    // In a real scenario, this might invoke a specific agent tool.
    // Here we can return a signal that the request was received,
    // or arguably, the UI should use the existing WebSocket connection.
    // 
    // If we MUST handle it here, we would need to fetch() to the local server.
    try {
        const response = await fetch(`http://localhost:${PORT}/api/execute-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: `Analizza questo codice:\n\`\`\`\n${code}\n\`\`\`` })
        });
        return await response.json();
    } catch (e) {
        console.error('Failed to proxy analyze-code to server:', e);
        return { error: 'Failed to reach Neural Engine' };
    }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});