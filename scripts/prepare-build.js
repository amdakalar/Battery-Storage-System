#!/usr/bin/env node
/**
 * Pre-build preparation script.
 * Run before every build (Vite or Electron).
 *
 * Tasks:
 *  1. Copy sql-wasm.wasm from node_modules → public/  (so Vite bundles it into dist/)
 *  2. Validate that the app icon exists
 *  3. Ensure dist-electron/ directory exists
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function ok(msg) {
  console.log(`  ✅  ${msg}`);
}

function fail(msg) {
  console.error(`  ❌  ${msg}`);
  process.exit(1);
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  ok(`Copied: ${path.relative(ROOT, src)}  →  ${path.relative(ROOT, dest)}`);
}

console.log('\n🔧  Pre-build preparation starting...\n');

// ── 1. Copy sql-wasm.wasm ────────────────────────────────────────────────────
const wasmSrc = path.join(ROOT, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
const wasmDest = path.join(ROOT, 'public', 'sql-wasm.wasm');

if (!fs.existsSync(wasmSrc)) {
  fail(`sql-wasm.wasm not found at:\n       ${wasmSrc}\n       Run: npm install`);
}
copyFile(wasmSrc, wasmDest);

// ── 2. Validate and copy icons for electron-builder ────────────────────────
const iconPath = path.join(ROOT, 'public', 'drone_battery_app_icon.ico');
const iconPngPath = path.join(ROOT, 'public', 'drone_battery_app_icon.png');

if (!fs.existsSync(iconPath)) {
  fail(`App icon not found: ${iconPath}`);
}

// Copy icon to build-resources/ and build/ so electron-builder finds it automatically for all shortcuts & targets
copyFile(iconPath, path.join(ROOT, 'build-resources', 'icon.ico'));
copyFile(iconPath, path.join(ROOT, 'build-resources', 'installerIcon.ico'));
copyFile(iconPath, path.join(ROOT, 'build-resources', 'uninstallerIcon.ico'));
if (fs.existsSync(iconPngPath)) {
  copyFile(iconPngPath, path.join(ROOT, 'build-resources', 'icon.png'));
}
copyFile(iconPath, path.join(ROOT, 'build', 'icon.ico'));

ok('Icons prepared in build-resources/ and build/');

// ── 3. Ensure dist-electron/ exists ─────────────────────────────────────────
const distElectronDir = path.join(ROOT, 'dist-electron');
fs.mkdirSync(distElectronDir, { recursive: true });
ok('dist-electron/ directory ready.');

// ── 4. Generate clean production SQLite database ─────────────────────────────
try {
  const { execSync } = require('child_process');
  console.log('Generating empty production database...');
  execSync('node scripts/create-prod-db.js', { stdio: 'inherit', cwd: ROOT });
  ok('Production database app.db generated successfully.');
} catch (e) {
  fail(`Failed to generate production database: ${e.message}`);
}

// ── 5. Print summary ─────────────────────────────────────────────────────────
console.log('\n🚀  Pre-build preparation complete!\n');
