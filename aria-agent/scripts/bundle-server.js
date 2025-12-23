import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function buildServer() {
  console.log('Bundling server...');

  try {
    await esbuild.build({
      entryPoints: [path.join(rootDir, 'src', 'server.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18', // Electron 28 uses Node 18
      outfile: path.join(rootDir, 'dist', 'server-bundle.js'),
      format: 'esm', // Use ESM to preserve import.meta behavior
      external: [
        'electron', 
        'robotjs', // Native modules must be external
        'canvas',
        'better-sqlite3',
        'node-llama-cpp', // Native module - crucial to externalize
        '@node-llama-cpp/*',
        '@nut-tree-fork/nut-js', // Native module
        '@reflink/reflink' // Native module
      ],
      sourcemap: true,
      minify: false, // Keep readable for now
    });
    console.log('Server bundled successfully: dist/server-bundle.js');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildServer();
