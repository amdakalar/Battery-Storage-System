/**
 * Electron main + preload compiler
 * Uses esbuild to compile TypeScript → CommonJS for Electron's Node.js runtime.
 *
 * Output:
 *   electron/main.ts    → dist-electron/main.js
 *   electron/preload.ts → dist-electron/preload.js
 */

import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IS_DEV = process.env.NODE_ENV === 'development';

// Ensure output directory exists
fs.mkdirSync(path.join(ROOT, 'dist-electron'), { recursive: true });

const sharedConfig = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['electron'],   // Never bundle Electron — it's always available at runtime
  format: 'cjs',            // Electron requires CommonJS
  minify: !IS_DEV,
  sourcemap: IS_DEV ? 'inline' : false,
  legalComments: 'none',
};

async function main() {
  console.log('\n🔨  Compiling Electron main + preload...\n');

  const results = await Promise.all([
    build({
      ...sharedConfig,
      entryPoints: [path.join(ROOT, 'electron', 'main.ts')],
      outfile: path.join(ROOT, 'dist-electron', 'main.js'),
    }),
    build({
      ...sharedConfig,
      entryPoints: [path.join(ROOT, 'electron', 'preload.ts')],
      outfile: path.join(ROOT, 'dist-electron', 'preload.js'),
    }),
  ]);

  const hasErrors = results.some((r) => r.errors.length > 0);
  if (hasErrors) {
    console.error('❌  Electron build completed with errors.');
    process.exit(1);
  }

  console.log('  ✅  dist-electron/main.js');
  console.log('  ✅  dist-electron/preload.js');
  console.log('\n✔   Electron build complete.\n');
}

main().catch((err) => {
  console.error('❌  Electron build failed:', err);
  process.exit(1);
});
