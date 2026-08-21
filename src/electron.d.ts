/**
 * TypeScript declarations for window.electronAPI
 * Exposed by electron/preload.ts via contextBridge.
 * Available in renderer when running inside Electron.
 */

interface ElectronAPI {
  /** Returns AppData/Roaming/<AppName> on Windows */
  getUserDataPath: () => Promise<string>;

  /** Returns app version from package.json */
  getAppVersion: () => Promise<string>;

  /** Returns the app installation path (inside ASAR) */
  getAppPath: () => Promise<string>;

  /** Returns the resources path (outside ASAR) */
  getResourcesPath: () => Promise<string>;

  /** Returns the log directory path */
  getLogPath: () => Promise<string>;

  /** Loads the SQLite database binary from AppData */
  loadDatabase: () => Promise<Uint8Array | null>;

  /** Saves the SQLite database binary to AppData */
  saveDatabase: (binaryData: Uint8Array) => Promise<boolean>;

  /** Runtime platform string */
  platform: string;

  /** Always true when running inside Electron */
  isElectron: true;
}

declare global {
  interface Window {
    /** Available only when running inside Electron (undefined in browser) */
    electronAPI?: ElectronAPI;
  }
}

export {};
