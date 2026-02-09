import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to other ports if 5173 is in use
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome120',
    minify: 'esbuild',
    sourcemap: false,
  },
});

