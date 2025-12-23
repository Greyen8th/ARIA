import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

async function watchdog() {
  console.log('🐺 ARIA WATCHDOG: Initiating Integrity Check & Build Sequence...');
  
  // Rate Limit Check
  const stateFile = path.join(process.cwd(), 'aria-data', '.watchdog_state');
  try {
    const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
    const lastRestart = new Date(state.lastRestart).getTime();
    const now = Date.now();
    const diff = now - lastRestart;
    
    // 5 minutes = 300,000 ms
    if (diff < 300000) {
      console.log(`⚠️ Rate Limit: Last restart was ${(diff/1000).toFixed(0)}s ago. Waiting...`);
      // Optional: exit or wait. For safety, we exit to prevent loops.
      // But if user requested it explicitly, maybe we should override?
      // Strict constraint says: "applica rate limit (max 1 restart / 5 minuti)"
      console.error('❌ Restart aborted due to rate limiting (< 5 min).');
      process.exit(1); 
    }
  } catch (e) {
    // No state file, ignore
  }

  try {
    // 1. Try Build
    console.log('🔨 Building project...');
    await execAsync('npm run build');
    console.log('✅ Build Successful.');
    
    // 2. Restart
    console.log('🔄 Triggering Restart...');
    // In dev environment with nodemon, touching server.ts triggers restart
    const serverFile = path.join(process.cwd(), 'src', 'server.ts');
    const now = new Date();
    await fs.utimes(serverFile, now, now);

    // Save state
    try {
        await fs.mkdir(path.join(process.cwd(), 'aria-data'), { recursive: true });
        await fs.writeFile(stateFile, JSON.stringify({ lastRestart: now.toISOString() }));
    } catch {}

    console.log('🚀 Restart signal sent.');
    
  } catch (error: any) {
    console.error('❌ BUILD FAILED! Initiating ROLLBACK Protocol...');
    console.error(`Reason: ${error.message}`);
    
    await performRollback();
  }
}

async function performRollback() {
  try {
    // Find modified files with backups
    const srcDir = path.join(process.cwd(), 'src');
    const files = await findBackups(srcDir);
    
    if (files.length === 0) {
      console.log('⚠️ No recent backups found. Manual intervention required.');
      return;
    }

    console.log(`Found ${files.length} files to restore.`);
    
    for (const file of files) {
      const originalPath = file.replace('.bak', '');
      console.log(`↺ Restoring ${originalPath}...`);
      await fs.copyFile(file, originalPath);
    }
    
    console.log('✅ Rollback Complete. System reverted to last known good state.');
    
    // Trigger restart to load restored code
    const serverFile = path.join(process.cwd(), 'src', 'server.ts');
    const now = new Date();
    await fs.utimes(serverFile, now, now);
    
  } catch (err) {
    console.error('☠️ CRITICAL: Rollback failed!', err);
  }
}

async function findBackups(dir: string): Promise<string[]> {
  const backups: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      backups.push(...await findBackups(fullPath));
    } else if (entry.name.endsWith('.bak')) {
      backups.push(fullPath);
    }
  }
  return backups;
}

watchdog();
