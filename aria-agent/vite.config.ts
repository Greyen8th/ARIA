import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/frontend',
  base: './', // CRITICAL: Ensures assets are loaded with relative paths in Electron
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/frontend')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3847',
      '/ws': {
        target: 'ws://localhost:3847',
        ws: true
      }
    }
  }
});
