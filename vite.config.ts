import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Must be './' so all asset paths are relative in the built index.html.
    // This is required for Electron's file:// protocol to resolve assets correctly.
    base: './',

    plugins: [react(), tailwindcss()],

    define: {
      'process.env.TURSO_DATABASE_URL': JSON.stringify(process.env.TURSO_DATABASE_URL || env.TURSO_DATABASE_URL || env.NEXT_PUBLIC_TURSO_DATABASE_URL || ''),
      'process.env.TURSO_AUTH_TOKEN': JSON.stringify(process.env.TURSO_AUTH_TOKEN || env.TURSO_AUTH_TOKEN || env.NEXT_PUBLIC_TURSO_AUTH_TOKEN || ''),
      'process.env.NEXT_PUBLIC_APP_NAME': JSON.stringify(process.env.NEXT_PUBLIC_APP_NAME || env.NEXT_PUBLIC_APP_NAME || 'Battery Storage System'),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // Public directory — sql-wasm.wasm is copied here by scripts/prepare-build.js
    // and Vite will include it verbatim in the dist/ output.
    publicDir: 'public',

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // Target modern Chromium (Electron 34 ships Chromium 132+)
      target: 'chrome120',
      // Enable source maps for production debugging
      sourcemap: false,
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            vendor: ['react', 'react-dom'],
            lucide: ['lucide-react'],
          },
        },
      },
    },

    server: {
      port: 5173,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
