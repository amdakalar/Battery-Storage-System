/**
 * Electron Preload Script — Battery Storage Management System
 *
 * Uses contextBridge to safely expose a typed API to the renderer.
 * The renderer CANNOT access Node.js or Electron APIs directly —
 * only what is explicitly listed here is accessible via window.electronAPI.
 */

import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  /**
   * Returns the user data path (e.g. AppData/Roaming/<AppName> on Windows).
   * This is where the app should store user-specific data.
   */
  getUserDataPath: (): Promise<string> =>
    ipcRenderer.invoke('get-user-data-path'),

  /**
   * Returns the app version string (from package.json).
   */
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-app-version'),

  /**
   * Returns the app installation path (inside ASAR archive).
   */
  getAppPath: (): Promise<string> =>
    ipcRenderer.invoke('get-app-path'),

  /**
   * Returns the resources path (outside ASAR — where extraResources land).
   */
  getResourcesPath: (): Promise<string> =>
    ipcRenderer.invoke('get-resources-path'),

  /**
   * Returns the log directory path.
   */
  getLogPath: (): Promise<string> =>
    ipcRenderer.invoke('get-log-path'),

  /**
   * Loads the SQLite database binary from AppData.
   */
  loadDatabase: (): Promise<Uint8Array | null> =>
    ipcRenderer.invoke('load-database'),

  /**
   * Saves the SQLite database binary to AppData.
   */
  saveDatabase: (binaryData: Uint8Array): Promise<boolean> =>
    ipcRenderer.invoke('save-database', binaryData),

  /**
   * Checks GitHub Releases for new updates.
   */
  checkForUpdate: (repoUrl?: string): Promise<any> =>
    ipcRenderer.invoke('check-github-update', repoUrl),

  /**
   * Downloads the release installer executable and launches it.
   */
  downloadAndInstallUpdate: (downloadUrl: string, fileName: string): Promise<any> =>
    ipcRenderer.invoke('download-and-install-update', { downloadUrl, fileName }),

  /**
   * Subscribes to download progress events.
   */
  onUpdateProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('update-download-progress', handler);
    return () => {
      ipcRenderer.removeListener('update-download-progress', handler);
    };
  },

  /**
   * Proxies Turso Cloud query execution directly through Electron Main process HTTPS.
   */
  tursoExecute: (url: string, authToken: string, stmt: any): Promise<any> =>
    ipcRenderer.invoke('turso-execute', { url, authToken, stmt }),

  /**
   * Quits the application immediately (used before running installer if needed).
   */
  quitApp: (): Promise<void> => ipcRenderer.invoke('quit-app'),

  /**
   * Platform string — 'win32', 'darwin', or 'linux'.
   */
  platform: process.platform as string,

  /**
   * Flag that the renderer can check to detect Electron environment.
   * In a regular browser, window.electronAPI will be undefined.
   */
  isElectron: true as const,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('[Preload] Electron API exposed via contextBridge. Platform:', process.platform);
