const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 950,
    minHeight: 680,
    title: 'سیستەمی بەڕێوەبردنی ستۆرج',
    icon: path.join(__dirname, 'public/drone_battery_app_icon.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Handle external links (WhatsApp, Phone call, Web) in default OS application
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

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
