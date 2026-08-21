/**
 * Electron Main Process — Battery Storage Management System
 * Production-ready with logging, crash handler, IPC, and secure window config.
 */

import { app, BrowserWindow, ipcMain, shell, dialog, nativeImage } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';

// Silence non-critical Electron dev security warnings in console
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged;
const APP_ID = 'com.ahmed.battery.storagesystem';

// Set App User Model ID immediately at top-level for Windows taskbar grouping & icon binding
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID);
}

// ─── Logging ──────────────────────────────────────────────────────────────────

const LOG_DIR = path.join(app.getPath('userData'), 'logs');

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function log(level: 'INFO' | 'WARN' | 'ERROR' | 'CRASH', message: string): void {
  try {
    ensureDir(LOG_DIR);
    const now = new Date();
    const timestamp = now.toISOString();
    const dateStr = timestamp.split('T')[0];
    const logFile = path.join(LOG_DIR, `app-${dateStr}.log`);
    const entry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(logFile, entry, 'utf8');
    // eslint-disable-next-line no-console
    if (IS_DEV) console.log(entry.trimEnd());
  } catch {
    // Silently ignore logging failures
  }
}

// ─── Error / Crash Handlers ──────────────────────────────────────────────────

process.on('uncaughtException', (error: Error) => {
  log('CRASH', `Uncaught Exception: ${error.message}\nStack: ${error.stack ?? 'N/A'}`);
  try {
    dialog.showErrorBox(
      'Battery System — Unexpected Error',
      `An unexpected error occurred:\n\n${error.message}\n\nLog file: ${LOG_DIR}`,
    );
  } catch {
    /* dialog may not be ready if app crashed before ready event */
  }
});

process.on('unhandledRejection', (reason: unknown) => {
  log('ERROR', `Unhandled Rejection: ${String(reason)}`);
});

// ─── Path Helpers ─────────────────────────────────────────────────────────────

/**
 * Get the app icon path.
 * Checks extraResources, public folder, and build resources.
 */
function getIconPath(): string | undefined {
  try {
    const candidates = [
      path.join(process.resourcesPath, 'icons', 'drone_battery_app_icon.ico'),
      path.join(process.resourcesPath, 'icons', 'drone_battery_app_icon.png'),
      path.join(__dirname, '..', 'public', 'drone_battery_app_icon.ico'),
      path.join(__dirname, '..', 'public', 'drone_battery_app_icon.png'),
      path.join(app.getAppPath(), 'public', 'drone_battery_app_icon.ico'),
      path.join(app.getAppPath(), 'public', 'drone_battery_app_icon.png'),
      path.join(__dirname, '..', 'build-resources', 'icon.ico'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get the preload script path (always in same dist-electron/ dir as main.js).
 */
function getPreloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

/**
 * Get the renderer HTML path for production.
 */
function getIndexPath(): string {
  return path.join(__dirname, '..', 'dist', 'index.html');
}

// ─── Window Creation ──────────────────────────────────────────────────────────

function createWindow(): void {
  log('INFO', `Creating BrowserWindow. isDev=${IS_DEV}, platform=${process.platform}, arch=${process.arch}`);
  log('INFO', `userData: ${app.getPath('userData')}`);

  // Ensure userData directory exists
  ensureDir(app.getPath('userData'));

  const iconPath = getIconPath();
  const preloadPath = getPreloadPath();

  log('INFO', `Icon path resolved: ${iconPath ?? 'none'}`);
  log('INFO', `Preload: ${preloadPath}`);

  const iconImage = iconPath ? nativeImage.createFromPath(iconPath) : undefined;

  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 950,
    minHeight: 680,
    title: 'سیستەمی بەڕێوەبردنی ستۆرج',
    icon: iconImage && !iconImage.isEmpty() ? iconImage : iconPath,
    autoHideMenuBar: true,
    show: false,                 // Prevent white flash on startup
    backgroundColor: '#f8fafc',
    webPreferences: {
      nodeIntegration: false,        // Security: No Node.js in renderer
      contextIsolation: true,        // Security: Isolated context
      sandbox: false,                // Needed for preload to access Node APIs
      preload: preloadPath,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: IS_DEV,              // Disable DevTools in production
    },
  });

  if (iconImage && !iconImage.isEmpty()) {
    mainWindow.setIcon(iconImage);
  }

  // Show window once fully rendered — avoids white flash and opens maximized
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    if (IS_DEV) {
      mainWindow.webContents.openDevTools();
    }
    log('INFO', 'Main window shown successfully and maximized.');
  });

  // Redirect all http/https/tel/mailto links to OS default browser/handler
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('http:') ||
      url.startsWith('https:') ||
      url.startsWith('tel:') ||
      url.startsWith('mailto:')
    ) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Load the renderer
  if (IS_DEV) {
    mainWindow.loadURL('http://localhost:5173').catch((err: Error) => {
      log('ERROR', `Failed to load dev URL: ${err.message}`);
    });
  } else {
    const indexPath = getIndexPath();
    log('INFO', `Loading production renderer: ${indexPath}`);
    mainWindow.loadFile(indexPath).catch((err: Error) => {
      log('ERROR', `Failed to load index.html: ${err.message}`);
      dialog.showErrorBox(
        'Load Error',
        `Could not load the application UI.\n\nPath: ${indexPath}\nError: ${err.message}`,
      );
    });
  }

  mainWindow.on('closed', () => log('INFO', 'Main window closed.'));
}

// ─── Database persistence & auto-backup ──────────────────────────────────────

function initDatabaseFile(): void {
  const dbPath = path.join(app.getPath('userData'), 'app.db');
  log('INFO', `Database path: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    log('INFO', 'Database file does not exist. Initializing...');
    
    // Locate the bundled database file
    let sourcePath = '';
    if (IS_DEV) {
      sourcePath = path.join(__dirname, '..', 'public', 'app.db');
    } else {
      // Packaged: copied via extraResources into resources/app.db
      sourcePath = path.join(process.resourcesPath, 'app.db');
    }
    
    log('INFO', `Searching database template at: ${sourcePath}`);
    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, dbPath);
        log('INFO', 'Database template successfully copied to userData directory.');
      } catch (err: any) {
        log('ERROR', `Failed to copy database template: ${err.message}`);
      }
    } else {
      log('WARN', 'Bundled database template not found. An empty database will be created by the renderer.');
    }
  }
}

function backupDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'app.db');
  if (fs.existsSync(dbPath)) {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    ensureDir(backupDir);
    const dateStr = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(backupDir, `app-backup-${dateStr}.db`);
    try {
      fs.copyFileSync(dbPath, backupPath);
      log('INFO', `Database backed up to: ${backupPath}`);
      
      // Keep only last 5 backups
      const files = fs.readdirSync(backupDir)
        .map(file => ({ name: file, time: fs.statSync(path.join(backupDir, file)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
      
      if (files.length > 5) {
        for (let i = 5; i < files.length; i++) {
          fs.unlinkSync(path.join(backupDir, files[i].name));
          log('INFO', `Removed old backup file: ${files[i].name}`);
        }
      }
    } catch (err: any) {
      log('ERROR', `Failed to backup database: ${err.message}`);
    }
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

/** Returns the user data path (AppData/Roaming/<AppName> on Windows) */
ipcMain.handle('get-user-data-path', () => app.getPath('userData'));

/** Returns the app version from package.json */
ipcMain.handle('get-app-version', () => app.getVersion());

/** Returns the app installation path (inside ASAR) */
ipcMain.handle('get-app-path', () => app.getAppPath());

/** Returns the resources path (outside ASAR — where extraResources land) */
ipcMain.handle('get-resources-path', () => process.resourcesPath);

/** Returns log directory path */
ipcMain.handle('get-log-path', () => LOG_DIR);

/** Loads SQLite database binary from AppData */
ipcMain.handle('load-database', async () => {
  const dbPath = path.join(app.getPath('userData'), 'app.db');
  log('INFO', `Loading database from: ${dbPath}`);
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath);
      return new Uint8Array(data);
    } catch (err: any) {
      log('ERROR', `Failed to read database file: ${err.message}`);
      throw err;
    }
  }
  return null;
});

/** Saves SQLite database binary to AppData */
ipcMain.handle('save-database', async (event, binaryData: Uint8Array) => {
  const dbPath = path.join(app.getPath('userData'), 'app.db');
  try {
    fs.writeFileSync(dbPath, Buffer.from(binaryData));
    return true;
  } catch (err: any) {
    log('ERROR', `Failed to write database file: ${err.message}`);
    throw err;
  }
});

// ─── GitHub Releases Auto-Updater System ─────────────────────────────────────

function cleanVersion(v: string): string {
  return v.replace(/^v/i, '').trim();
}

function isNewerVersion(latest: string, current: string): boolean {
  const lParts = cleanVersion(latest).split('.').map(Number);
  const cParts = cleanVersion(current).split('.').map(Number);
  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Battery-Storage-System-App',
        'Accept': 'application/vnd.github.v3+json',
      },
    };
    https.get(url, options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode === 404) {
            resolve({ notFound: true, message: parsed.message || 'Not Found' });
          } else if (res.statusCode !== 200) {
            reject(new Error(`GitHub API HTTP ${res.statusCode}: ${parsed.message || 'Error'}`));
          } else {
            resolve(parsed);
          }
        } catch (e: any) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url: string, destPath: string, onProgress: (transferred: number, total: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = (currentUrl: string) => {
      const protocol = currentUrl.startsWith('https') ? https : http;
      const req = protocol.get(currentUrl, { headers: { 'User-Agent': 'Battery-Storage-System-App' } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status code ${res.statusCode}`));
          return;
        }
        const total = parseInt(res.headers['content-length'] || '0', 10);
        let transferred = 0;
        const fileStream = fs.createWriteStream(destPath);
        res.on('data', (chunk) => {
          transferred += chunk.length;
          onProgress(transferred, total);
        });
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(() => resolve());
        });
        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => reject(err));
        });
      });
      req.on('error', (err) => reject(err));
    };
    request(url);
  });
}

function getDefaultRepo(): string {
  try {
    const pkgPath = path.join(app.getAppPath(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const repoUrl = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url || '';
      const clean = repoUrl.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');
      if (clean.includes('/')) return clean;
    }
  } catch {
    /* fallback */
  }
  return 'amdakalar/Battery-Storage-System';
}

ipcMain.handle('check-github-update', async (_event, customRepo?: string) => {
  try {
    const rawRepo = (customRepo || '').trim() || getDefaultRepo();
    let repoPath = rawRepo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');
    if (!repoPath.includes('/')) {
      return {
        success: false,
        hasUpdate: false,
        error: 'ناونیشانی ریپۆزتۆری گیتهاپ دروست نییە. پێویستە بە شێوازی owner/repo بێت',
      };
    }

    const apiUrl = `https://api.github.com/repos/${repoPath}/releases/latest`;
    log('INFO', `Checking for updates from: ${apiUrl}`);
    const releaseData = await fetchJson(apiUrl);

    const currentVersion = app.getVersion();

    if (releaseData.notFound) {
      log('INFO', 'No GitHub release found for this repository yet.');
      return {
        success: true,
        hasUpdate: false,
        latestVersion: currentVersion,
        currentVersion,
        releaseName: `v${currentVersion}`,
        releaseNotes: 'تا ئێستا هیچ وەشانێکی نوێ لە بەشی Releases لە گیتهاپ دانەنراوە.',
      };
    }

    const latestVersion = releaseData.tag_name || releaseData.name || '';
    const hasUpdate = isNewerVersion(latestVersion, currentVersion);

    let exeAsset = (releaseData.assets || []).find((a: any) => a.name.endsWith('.exe'));
    if (!exeAsset && releaseData.assets && releaseData.assets.length > 0) {
      exeAsset = releaseData.assets[0];
    }

    return {
      success: true,
      hasUpdate,
      latestVersion: cleanVersion(latestVersion),
      currentVersion,
      releaseName: releaseData.name || latestVersion,
      releaseNotes: releaseData.body || 'هیچ تێبینییەک لەگەڵ وەشانی نوێدا نەنووسراوە.',
      publishedAt: releaseData.published_at,
      downloadUrl: exeAsset ? exeAsset.browser_download_url : undefined,
      fileName: exeAsset ? exeAsset.name : undefined,
      fileSize: exeAsset ? exeAsset.size : undefined,
      htmlUrl: releaseData.html_url,
    };
  } catch (err: any) {
    log('ERROR', `GitHub Update Check failed: ${err.message}`);
    return {
      success: false,
      hasUpdate: false,
      error: `کێشە ڕوویدا لە وەرگرتنی ئەپدەیت لە گیتهاپ: ${err.message}`,
    };
  }
});

ipcMain.handle('download-and-install-update', async (event, { downloadUrl, fileName }: { downloadUrl: string; fileName: string }) => {
  try {
    if (!downloadUrl) {
      return { success: false, error: 'لینکی داونلۆدکردن بەردەست نییە.' };
    }
    const tempDir = app.getPath('temp');
    const safeFileName = fileName || 'BatterySystemSetup.exe';
    const targetPath = path.join(tempDir, safeFileName);

    log('INFO', `Starting update download from ${downloadUrl} to ${targetPath}`);

    await downloadFile(downloadUrl, targetPath, (transferred, total) => {
      const percent = total > 0 ? Math.min(100, Math.round((transferred / total) * 100)) : 0;
      event.sender.send('update-download-progress', { percent, transferred, total });
    });

    log('INFO', `Update downloaded successfully to ${targetPath}. Creating safety backup and launching installer...`);

    // Safety backup of database before launching installer
    try {
      backupDatabase();
      log('INFO', 'Safety pre-update database backup completed.');
    } catch (e: any) {
      log('WARN', `Pre-update backup warning: ${e.message}`);
    }

    try {
      // Launch installer detached so it runs independently
      const child = spawn(targetPath, [], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      log('INFO', `Installer launched successfully with PID: ${child.pid}. Automatically quitting app...`);

      // Quit app cleanly so installer can upgrade seamlessly
      setTimeout(() => {
        app.quit();
      }, 250);

      return { success: true, filePath: targetPath };
    } catch (launchErr: any) {
      log('WARN', `spawn failed, falling back to shell.openPath: ${launchErr.message}`);
      const openError = await shell.openPath(targetPath);
      if (openError) {
        log('ERROR', `Failed to launch installer: ${openError}`);
        return { success: false, error: `کێشە لە دەستپێکردنی تەنسیبەکە ڕوویدا: ${openError}` };
      }
      setTimeout(() => {
        app.quit();
      }, 400);
      return { success: true, filePath: targetPath };
    }
  } catch (err: any) {
    log('ERROR', `Update download error: ${err.message}`);
    return { success: false, error: `کێشە لە داونلۆدکردنی پەڕگەکە ڕوویدا: ${err.message}` };
  }
});

ipcMain.handle('quit-app', () => {
  app.quit();
});

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Set App User Model ID — required for Windows taskbar pinning and notifications
  if (process.platform === 'win32') {
    app.setAppUserModelId(APP_ID);
  }

  log(
    'INFO',
    `App ready. version=${app.getVersion()}, isPackaged=${app.isPackaged}, locale=${app.getLocale()}`,
  );

  // Initialize and backup database in AppData
  initDatabaseFile();
  backupDatabase();

  createWindow();

  // macOS: recreate window on dock click when no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log('INFO', 'All windows closed.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log('INFO', 'Application shutting down gracefully.');
});
