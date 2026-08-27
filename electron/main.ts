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

// ─── Environment & Platform ───────────────────────────────────────────────────

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
      webSecurity: true,             // Security: Enforce Same-Origin Policy (Turso & GitHub are proxied via IPC)
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

    const currentVersion = app.getVersion();
    let latestVersion = '';
    let releaseName = '';
    let releaseNotes = '';
    let publishedAt = '';
    let downloadUrl: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let fileSize: number | undefined = undefined;
    let htmlUrl = `https://github.com/${repoPath}`;

    // 1. Try Releases API
    const apiUrl = `https://api.github.com/repos/${repoPath}/releases/latest`;
    log('INFO', `Checking for updates from: ${apiUrl}`);
    const releaseData = await fetchJson(apiUrl);

    if (!releaseData.notFound && (releaseData.tag_name || releaseData.name)) {
      latestVersion = releaseData.tag_name || releaseData.name || '';
      releaseName = releaseData.name || latestVersion;
      releaseNotes = releaseData.body || 'تەواوی گۆڕانکاری و نوێکارییەکان لە وەشانی نوێدا بەردەستن.';
      publishedAt = releaseData.published_at;
      htmlUrl = releaseData.html_url || htmlUrl;

      let exeAsset = (releaseData.assets || []).find((a: any) => a.name.endsWith('.exe'));
      if (!exeAsset && releaseData.assets && releaseData.assets.length > 0) {
        exeAsset = releaseData.assets[0];
      }
      if (exeAsset) {
        downloadUrl = exeAsset.browser_download_url;
        fileName = exeAsset.name;
        fileSize = exeAsset.size;
      }
    } else {
      // 2. Fallback to Tags API if no formal GitHub Release object exists
      log('INFO', 'No formal GitHub release object found. Checking repository tags fallback...');
      try {
        const tagsData = await fetchJson(`https://api.github.com/repos/${repoPath}/tags`);
        if (Array.isArray(tagsData) && tagsData.length > 0) {
          latestVersion = tagsData[0].name || '';
          releaseName = `وەشانی نوێ ${latestVersion}`;
          releaseNotes = `وەشانی نوێتر (${latestVersion}) لەسەر سێرڤەری GitHub بەردەستە.`;
          htmlUrl = `https://github.com/${repoPath}/releases/tag/${latestVersion}`;
        }
      } catch (tagErr) {
        log('WARN', `Tags check fallback error: ${tagErr}`);
      }
    }

    const hasUpdate = isNewerVersion(latestVersion || currentVersion, currentVersion);

    return {
      success: true,
      hasUpdate,
      latestVersion: cleanVersion(latestVersion || currentVersion),
      currentVersion,
      releaseName: releaseName || `v${currentVersion}`,
      releaseNotes: releaseNotes || 'ئەم وەشانە نوێکارییەکان و چاکسازییەکانی تێدایە.',
      publishedAt,
      downloadUrl,
      fileName,
      fileSize,
      htmlUrl,
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
    if (!downloadUrl || typeof downloadUrl !== 'string') {
      return { success: false, error: 'لینکی داونلۆدکردن بەردەست نییە.' };
    }

    // Security: Validate download URL domain to prevent Arbitrary Binary Download & Execution (RCE)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(downloadUrl);
    } catch {
      return { success: false, error: 'لینکی داونلۆدکردن نادروستە.' };
    }

    if (parsedUrl.protocol !== 'https:') {
      return { success: false, error: 'داونلۆدکردن دەبێت تەنها بە پرۆتۆکۆلی پارێزراوی HTTPS بێت.' };
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const isAllowedHost =
      hostname === 'github.com' ||
      hostname === 'api.github.com' ||
      hostname === 'objects.githubusercontent.com' ||
      hostname.endsWith('.githubusercontent.com');

    if (!isAllowedHost) {
      log('WARN', `Untrusted update download URL rejected: ${downloadUrl}`);
      return { success: false, error: 'ناونیشانی سێرڤەری داونلۆد لە سەرچاوەی باوەڕپێکراوی فەرمی GitHub نییە.' };
    }

    const tempDir = app.getPath('temp');
    // Security: Prevent directory traversal on file name
    const rawFileName = path.basename(fileName || '').trim();
    const safeFileName = rawFileName && rawFileName.toLowerCase().endsWith('.exe')
      ? rawFileName
      : 'BatterySystemSetup.exe';
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

// Proxy Turso Cloud queries natively through Node.js HTTPS in Main Process — 100% immune to CORS and "Failed to fetch"
ipcMain.handle('turso-execute', async (_event, { url, authToken, stmt }: { url?: string; authToken?: string; stmt: any }) => {
  try {
    const targetUrl = (url || '').trim();
    const targetToken = (authToken || '').trim();
    if (!targetUrl || typeof targetUrl !== 'string') return { success: false, error: 'Database URL is required' };

    let httpUrl = targetUrl.replace(/^libsql:\/\//i, 'https://');
    if (!httpUrl.startsWith('http://') && !httpUrl.startsWith('https://')) {
      httpUrl = `https://${httpUrl}`;
    }
    const endpoint = `${httpUrl.replace(/\/$/, '')}/v2/pipeline`;

    const sql = typeof stmt === 'string' ? stmt : stmt?.sql || '';
    const args = typeof stmt === 'object' && Array.isArray(stmt?.args) ? stmt.args : [];

    const formattedArgs = args.map((arg: any) => {
      if (arg === null || arg === undefined) return { type: 'null' };
      if (typeof arg === 'number') {
        return Number.isInteger(arg) ? { type: 'integer', value: String(arg) } : { type: 'float', value: arg };
      }
      if (typeof arg === 'boolean') {
        return { type: 'integer', value: arg ? '1' : '0' };
      }
      return { type: 'text', value: String(arg) };
    });

    const payload = JSON.stringify({
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args: formattedArgs,
          },
        },
        { type: 'close' },
      ],
    });

    const parsedUrl = new URL(endpoint);
    const responseText = await new Promise<string>((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': targetToken ? `Bearer ${targetToken}` : '',
          'User-Agent': 'Battery-Storage-Desktop/1.0',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`Turso HTTP ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.write(payload);
      req.end();
    });

    const data = JSON.parse(responseText);
    const result = data.results?.[0]?.response?.result;
    if (!result) {
      const errMessage = data.results?.[0]?.response?.error?.message || 'Turso query execution failed';
      return { success: false, error: errMessage };
    }

    const cols = (result.cols || []).map((c: any) => c.name);
    const rows = (result.rows || []).map((rowArr: any[]) => {
      const rowObj: any = {};
      rowArr.forEach((val: any, idx: number) => {
        const colName = cols[idx];
        if (val && val.type === 'null') rowObj[colName] = null;
        else if (val && val.type === 'integer') rowObj[colName] = parseInt(val.value, 10);
        else if (val && val.type === 'float') rowObj[colName] = Number(val.value);
        else if (val && val.type === 'text') rowObj[colName] = String(val.value);
        else rowObj[colName] = val?.value ?? val;
      });
      return rowObj;
    });

    return { success: true, rows, columns: cols };
  } catch (err: any) {
    log('ERROR', `Turso IPC execution error: ${err.message}`);
    return { success: false, error: err.message };
  }
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
