const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');
const { autoUpdater } = require('electron-updater');

// Check if running in development mode
// Don't use app.isPackaged here since app is not ready yet
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath);

let mainWindow;
let backendProcess = null;
let isCreatingWindow = false; // Flag to prevent duplicate window creation

// Create log file for debugging
const logFilePath = path.join(os.homedir(), '.sqlingo', 'electron-main.log');
function logToFile(message) {
  try {
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
    console.log(message);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Load settings from localStorage equivalent
function loadSettings() {
  try {
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');

    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(data);
      return settings;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  // Default settings
  return {
    alwaysOnTop: true,
    snapWidth: 500, // Default snap width
    enableCustomSnap: true, // Enable custom snap by default
    startPosition: 'center' // Options: 'center', 'left', 'right'
  };
}

// Start backend server
function startBackend() {
  if (backendProcess) {
    logToFile('Backend already running');
    return;
  }

  logToFile('=== Starting backend server ===');
  logToFile(`Mode: ${isDev ? 'Development' : 'Production'}`);

  try {
    // Get backend executable path
    let backendPath;
    if (isDev) {
      // In development, use Python backend
      backendPath = path.join(__dirname, '..', '..', 'backend', 'main.py');
      logToFile(`Starting backend in development mode: ${backendPath}`);

      // Try to find Python executable
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

      // Pass environment variables to backend (including DEV_MODE)
      const backendEnv = {
        ...process.env,  // Inherit all env vars from parent process
      };

      logToFile(`DEV_MODE: ${backendEnv.DEV_MODE || 'not set'}`);

      backendProcess = spawn(pythonCmd, [backendPath], {
        cwd: path.join(__dirname, '..', '..', 'backend'),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: backendEnv
      });
    } else {
      // In production, use bundled executable
      const resourcesPath = process.resourcesPath || path.join(__dirname, '..');
      logToFile(`Resources path: ${resourcesPath}`);

      // Try multiple possible paths for the backend
      const possiblePaths = [
        path.join(resourcesPath, 'app.asar.unpacked', 'resources', 'db-chat-backend'),
        path.join(resourcesPath, 'app', 'resources', 'db-chat-backend'),
        path.join(__dirname, '..', 'resources', 'db-chat-backend')
      ];

      logToFile('Checking possible backend paths:');
      possiblePaths.forEach((p, i) => {
        const exists = fs.existsSync(p);
        logToFile(`  ${i + 1}. ${exists ? '✓' : '✗'} ${p}`);
      });

      backendPath = possiblePaths.find(p => fs.existsSync(p));

      if (!backendPath) {
        logToFile('ERROR: Backend executable not found in any path!');
        return;
      }

      logToFile(`✓ Found backend at: ${backendPath}`);

      // Make sure the backend is executable
      try {
        fs.chmodSync(backendPath, '755');
        logToFile('✓ Set executable permissions');
      } catch (error) {
        logToFile(`Warning: Could not set permissions: ${error.message}`);
      }

      logToFile('Spawning backend process...');

      // Set working directory to resources folder where .env is located
      const backendWorkingDir = path.dirname(backendPath);
      logToFile(`Backend working directory: ${backendWorkingDir}`);

      backendProcess = spawn(backendPath, [], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        cwd: backendWorkingDir  // Set working directory so backend can find .env file
      });

      if (backendProcess.pid) {
        logToFile(`✓ Backend process spawned with PID: ${backendProcess.pid}`);
      } else {
        logToFile('ERROR: Backend process spawned but no PID');
      }
    }

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      logToFile(`[Backend stdout]: ${output}`);
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      logToFile(`[Backend stderr]: ${output}`);
    });

    backendProcess.on('error', (error) => {
      logToFile(`[Backend spawn error]: ${error.message}`);
    });

    backendProcess.on('exit', (code, signal) => {
      logToFile(`Backend process exited with code ${code}, signal ${signal}`);
      backendProcess = null;
    });

    logToFile('✓ Backend process started successfully');
  } catch (error) {
    logToFile(`EXCEPTION in startBackend: ${error.message}`);
    logToFile(`Stack: ${error.stack}`);
  }
}

// ============ Auto-Update ============
function setupAutoUpdater() {
  if (isDev) {
    logToFile('Skipping auto-updater in development mode');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    logToFile('[AutoUpdater] Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    logToFile(`[AutoUpdater] Update available: ${info.version}`);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', { version: info.version });
    }
  });

  autoUpdater.on('update-not-available', () => {
    logToFile('[AutoUpdater] No update available');
  });

  autoUpdater.on('download-progress', (progress) => {
    logToFile(`[AutoUpdater] Download progress: ${Math.round(progress.percent)}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', { percent: Math.round(progress.percent) });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    logToFile(`[AutoUpdater] Update downloaded: ${info.version}`);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', { version: info.version });
    }
  });

  autoUpdater.on('error', (error) => {
    logToFile(`[AutoUpdater] Error: ${error.message}`);
  });

  // Check for updates after a short delay
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      logToFile(`[AutoUpdater] Check failed: ${err.message}`);
    });
  }, 5000);
}

// Stop backend server
function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// Wait for backend to be ready
// Port from environment or default
const DESKTOP_BACKEND_PORT = parseInt(process.env.DESKTOP_BACKEND_PORT || '39847');

async function waitForBackend(maxAttempts = 30, interval = 1000) {
  logToFile(`Waiting for backend on fixed port ${DESKTOP_BACKEND_PORT}...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const http = require('http');

      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${DESKTOP_BACKEND_PORT}/health`, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Backend returned status ${res.statusCode}`));
          }
        });

        req.on('error', reject);
        req.setTimeout(500);
      });

      logToFile(`✓ Backend is ready on port ${DESKTOP_BACKEND_PORT}! (attempt ${attempt}/${maxAttempts})`);
      return;
    } catch (error) {
      if (attempt < maxAttempts) {
        logToFile(`Attempt ${attempt}/${maxAttempts}: ${error.message}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      } else {
        throw new Error(`Backend failed to start after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }
}

// Set initial window position based on settings
function setInitialPosition() {
  if (!mainWindow) return;

  const settings = loadSettings();
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;

  const width = settings.snapWidth || 500;
  const height = 700; // Default height

  let x, y;

  switch (settings.startPosition) {
    case 'left':
      // Snap to left edge
      x = workArea.x;
      y = workArea.y;
      mainWindow.setBounds({
        x,
        y,
        width,
        height: workArea.height
      });
      console.log('Window positioned at left edge');
      break;

    case 'right':
      // Snap to right edge
      x = workArea.x + workArea.width - width;
      y = workArea.y;
      mainWindow.setBounds({
        x,
        y,
        width,
        height: workArea.height
      });
      console.log('Window positioned at right edge');
      break;

    case 'center':
    default:
      // Center on screen (default behavior)
      x = workArea.x + Math.floor((workArea.width - 500) / 2);
      y = workArea.y + Math.floor((workArea.height - height) / 2);
      mainWindow.setBounds({
        x,
        y,
        width: 500,
        height
      });
      console.log('Window positioned at center');
      break;
  }
}

// Handle custom window snapping
function handleWindowSnap() {
  if (!mainWindow) return;

  const settings = loadSettings();

  // Check if custom snap is enabled
  if (!settings.enableCustomSnap) return;

  const { screen } = require('electron');
  const windowBounds = mainWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: windowBounds.x, y: windowBounds.y });
  const { workArea } = display;

  const SNAP_THRESHOLD = 50; // Distance from edge to trigger snap (pixels)
  const CUSTOM_WIDTH = settings.snapWidth || 500; // Custom width from settings
  const CUSTOM_HEIGHT = workArea.height; // Full height

  const distanceFromLeft = windowBounds.x - workArea.x;
  const distanceFromRight = (workArea.x + workArea.width) - (windowBounds.x + windowBounds.width);
  const distanceFromTop = windowBounds.y - workArea.y;

  // Snap to left edge
  if (distanceFromLeft >= 0 && distanceFromLeft <= SNAP_THRESHOLD && distanceFromTop <= SNAP_THRESHOLD) {
    mainWindow.setBounds({
      x: workArea.x,
      y: workArea.y,
      width: CUSTOM_WIDTH,
      height: CUSTOM_HEIGHT
    });
    console.log(`Snapped to left edge with width: ${CUSTOM_WIDTH}px`);
    return;
  }

  // Snap to right edge
  if (distanceFromRight >= 0 && distanceFromRight <= SNAP_THRESHOLD && distanceFromTop <= SNAP_THRESHOLD) {
    mainWindow.setBounds({
      x: workArea.x + workArea.width - CUSTOM_WIDTH,
      y: workArea.y,
      width: CUSTOM_WIDTH,
      height: CUSTOM_HEIGHT
    });
    console.log(`Snapped to right edge with width: ${CUSTOM_WIDTH}px`);
    return;
  }
}

function createWindow() {
  // Prevent duplicate window creation
  if (isCreatingWindow || mainWindow) {
    logToFile(`⚠️  Prevented duplicate window creation (isCreating: ${isCreatingWindow}, exists: ${!!mainWindow})`);
    return;
  }

  logToFile('Creating main window...');
  isCreatingWindow = true;

  const settings = loadSettings();

  mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    minWidth: 400,
    minHeight: 500,
    frame: false, // No default frame (custom titlebar)
    icon: path.join(__dirname, '..', isDev ? 'public' : 'dist', 'SQLingoICON_withoutbackround.png'),
    alwaysOnTop: settings.alwaysOnTop !== false, // Default to true
    transparent: false,
    resizable: true,
    movable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Custom window snapping behavior
  let isMoving = false;
  let moveTimeout = null;
  let resizeTimeout = null;

  mainWindow.on('move', () => {
    isMoving = true;

    // Clear previous timeout
    if (moveTimeout) {
      clearTimeout(moveTimeout);
    }

    // Set timeout to detect when movement stops
    moveTimeout = setTimeout(() => {
      if (isMoving) {
        handleWindowSnap();
        isMoving = false;
      }
    }, 100); // Wait 100ms after movement stops
  });

  // Detect when OS snaps window to half-screen and override it
  mainWindow.on('resize', () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(() => {
      const settings = loadSettings();
      if (!settings.enableCustomSnap) return;

      const { screen } = require('electron');
      const windowBounds = mainWindow.getBounds();
      const display = screen.getDisplayNearestPoint({ x: windowBounds.x, y: windowBounds.y });
      const { workArea } = display;

      const CUSTOM_WIDTH = settings.snapWidth || 500;

      // Check if window is snapped to left or right (x position is at edge)
      const isSnappedLeft = windowBounds.x === workArea.x;
      const isSnappedRight = windowBounds.x + windowBounds.width === workArea.x + workArea.width;

      // Check if window height is full screen height
      const isFullHeight = windowBounds.height >= workArea.height - 50; // Allow some margin

      // If it's snapped to edge with full height but wrong width, fix it
      if ((isSnappedLeft || isSnappedRight) && isFullHeight && windowBounds.width !== CUSTOM_WIDTH) {
        if (isSnappedLeft) {
          mainWindow.setBounds({
            x: workArea.x,
            y: workArea.y,
            width: CUSTOM_WIDTH,
            height: workArea.height
          });
          console.log(`Override OS snap: Fixed left snap to ${CUSTOM_WIDTH}px`);
        } else if (isSnappedRight) {
          mainWindow.setBounds({
            x: workArea.x + workArea.width - CUSTOM_WIDTH,
            y: workArea.y,
            width: CUSTOM_WIDTH,
            height: workArea.height
          });
          console.log(`Override OS snap: Fixed right snap to ${CUSTOM_WIDTH}px`);
        }
      }
    }, 150); // Wait a bit longer for resize to complete
  });

  // Load app
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Set initial position after window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    setInitialPosition();
    isCreatingWindow = false; // Reset flag when window is fully loaded
    logToFile('✓ Main window created successfully');
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    logToFile('Main window closed');
    mainWindow = null;
    isCreatingWindow = false; // Reset flag when window closes
  });
}

// Handle protocol on Windows/Linux (when app is already running)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Check for protocol URL in command line (Windows)
    const url = commandLine.find(arg => arg.startsWith('sqlingo://'));
    if (url) {
      try {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');

        if (token && mainWindow) {
          mainWindow.webContents.send('auth-callback', { token });
        }
      } catch (error) {
        console.error('Failed to parse OAuth callback URL:', error);
      }
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Register custom protocol for OAuth callback
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('sqlingo', process.execPath, [path.resolve(process.argv[1])]);
    } else {
      app.setAsDefaultProtocolClient('sqlingo');
    }
  } else {
    app.setAsDefaultProtocolClient('sqlingo');
  }

  // Start backend server
  startBackend();

  // Setup auto-updater
  setupAutoUpdater();

  // Wait for backend to be ready before creating window
  waitForBackend().then(() => {
    createWindow();
  }).catch((error) => {
    logToFile(`Failed to connect to backend: ${error.message}`);
    // Create window anyway to show error message
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle custom protocol on macOS (open-url event)
app.on('open-url', (event, url) => {
  event.preventDefault();
  logToFile(`Received open-url event: ${url}`);

  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'sqlingo:') {
      const token = urlObj.searchParams.get('token');

      if (token) {
        logToFile(`✓ Extracted token from URL`);

        if (mainWindow) {
          mainWindow.webContents.send('auth-callback', { token });
          mainWindow.focus();
          logToFile('✓ Sent auth-callback to renderer');
        } else {
          logToFile('⚠️  Main window not available');
        }
      } else {
        logToFile('⚠️  No token found in URL');
      }
    }
  } catch (error) {
    logToFile(`Error parsing open-url: ${error.message}`);
  }
});

// Stop backend when app quits
app.on('before-quit', () => {
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});

// IPC handlers
ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('set-always-on-top', (event, flag) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag);

    // Save setting to file
    try {
      const userDataPath = app.getPath('userData');
      const settingsPath = path.join(userDataPath, 'settings.json');

      let settings = {};
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf8');
        settings = JSON.parse(data);
      }

      settings.alwaysOnTop = flag;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

      console.log(`Always on top: ${flag ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
});

ipcMain.handle('set-start-position', (event, position) => {
  // Save setting to file
  try {
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');

    let settings = {};
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(data);
    }

    settings.startPosition = position;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    console.log(`Start position set to: ${position}`);
  } catch (error) {
    console.error('Failed to save start position setting:', error);
  }
});

// Open external URL
ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// Read backend port configuration
ipcMain.handle('read-port-config', async () => {
  try {
    const os = require('os');
    const homeDir = os.homedir();
    const configPath = path.join(homeDir, '.sqlingo', 'backend_port.json');

    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      console.log('✓ Read backend port configuration:', config);
      return config;
    } else {
      console.log('⚠️  Backend port config file not found, using defaults');
      return null;
    }
  } catch (error) {
    console.error('Failed to read backend port configuration:', error);
    return null;
  }
});

// ============ Auto-Update IPC Handlers ============
ipcMain.handle('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

logToFile('=== Electron app started ===');
logToFile(`Mode: ${isDev ? 'Development' : 'Production'}`);
logToFile(`Platform: ${process.platform}`);
logToFile(`App version: ${app.getVersion()}`);
logToFile(`Log file: ${logFilePath}`);

