# Battery Storage Management System — Production Build Guide

## Quick Start

```bash
# Install dependencies (first time only)
npm install

# Development mode (Vite + Electron hot-reload)
npm run dev

# Production build only (no installer)
npm run build

# Build + generate Windows installer (Setup.exe + Portable.exe)
npm run dist

# Build + generate installer without publishing
npm run release
```

## Output

After `npm run dist`, installers appear in **`release/`**:

| File | Description |
|------|-------------|
| `Battery Storage System-1.0.0-Setup-x64.exe` | NSIS installer (64-bit) |
| `Battery Storage System-1.0.0-Setup-ia32.exe` | NSIS installer (32-bit) |
| `Battery Storage System-1.0.0-Portable-x64.exe` | Standalone portable (64-bit) |

## Project Structure

```
Battery ch/
├── electron/               ← Electron main process (TypeScript source)
│   ├── main.ts             ← Main process: window, IPC, logging, crash handler
│   └── preload.ts          ← Preload: exposes electronAPI via contextBridge
├── src/                    ← React renderer (Vite source)
│   ├── App.tsx
│   ├── utils/
│   │   ├── sqliteDb.ts     ← sql.js WASM database (localStorage-backed)
│   │   └── storage.ts      ← LocalStorage data management
│   └── electron.d.ts       ← TypeScript types for window.electronAPI
├── public/                 ← Static assets (copied to dist/ by Vite)
│   ├── drone_battery_app_icon.ico
│   └── sql-wasm.wasm       ← Copied by prepare-build.js from node_modules
├── scripts/
│   ├── prepare-build.js    ← Pre-build: copies WASM, validates icon
│   └── build-electron.mjs  ← esbuild: compiles electron/*.ts → dist-electron/
├── dist/                   ← Vite renderer build output
├── dist-electron/          ← Compiled Electron main/preload
├── release/                ← electron-builder installer output
├── electron-builder.yml    ← Packaging configuration
├── vite.config.ts          ← Vite configuration
└── tsconfig.electron.json  ← TypeScript config for Electron files
```

## How Data is Stored

- **Database engine**: sql.js (SQLite compiled to WebAssembly, runs in renderer)
- **Storage**: Electron's built-in localStorage → stored at `%APPDATA%\Battery Storage System\`
- **No write access to Program Files** — data always goes to AppData
- **Fresh installs**: start with empty battery list (no sample data)

## Logging

Production logs are written to:
```
%APPDATA%\Battery Storage System\logs\app-YYYY-MM-DD.log
```
