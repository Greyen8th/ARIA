import { Tool } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Audit Log Helper
async function appendAuditLog(entry: { action: string; file: string; reason: string; backup?: string; status: string }) {
  const logPath = path.join(process.cwd(), 'aria-data', 'audit.log');
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${entry.status.toUpperCase()} | ${entry.action} | File: ${entry.file} | Backup: ${entry.backup || 'N/A'} | Reason: ${entry.reason}\n`;
  
  try {
    await fs.appendFile(logPath, logLine, 'utf-8');
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// Helper for rotating backups
async function rotateBackups(filePath: string): Promise<string> {
  const MAX_BACKUPS = 3;
  const backupBase = `${filePath}.bak`;
  
  // Shift existing backups: .bak2 -> .bak3, .bak -> .bak2
  try {
    // Delete oldest if exists
    try { await fs.unlink(`${backupBase}${MAX_BACKUPS}`); } catch {}
    
    // Shift loop
    for (let i = MAX_BACKUPS - 1; i >= 1; i--) {
      const src = i === 1 ? backupBase : `${backupBase}${i - 1}`;
      const dest = `${backupBase}${i}`;
      try { await fs.rename(src, dest); } catch {}
    }
    
    // Create new backup from current file
    await fs.copyFile(filePath, backupBase);
    return backupBase;
  } catch (error) {
    console.error('Backup rotation failed:', error);
    // Fallback: simple timestamp backup
    const tsBackup = `${filePath}.bak-${Date.now()}`;
    await fs.copyFile(filePath, tsBackup);
    return tsBackup;
  }
}

export const evolutionTools: Tool[] = [
  {
    name: 'self_update_core',
    description: 'DANGEROUS: Allows ARIA to rewrite its own source code files to upgrade logic or fix bugs.',
    parameters: [
      {
        name: 'filePath',
        type: 'string',
        description: 'Relative path to the file in src/ (e.g. "agent/executor.ts")',
        required: true
      },
      {
        name: 'newContent',
        type: 'string',
        description: 'The full new content of the file',
        required: true
      },
      {
        name: 'reason',
        type: 'string',
        description: 'Why this update is necessary (audit log)',
        required: true
      }
    ],
    execute: async ({ filePath, newContent, reason }) => {
      try {
        // Security check: only allow editing inside src/
        if (filePath.includes('..') || filePath.startsWith('/')) {
            return 'ERROR: Security violation. Can only modify files within src/';
        }
        
        const fullPath = path.join(process.cwd(), 'src', filePath);
        
        // Rotating Backup before write
        let backupInfo = '';
        try {
            await fs.access(fullPath); // Check if exists
            const backupPath = await rotateBackups(fullPath);
            backupInfo = `Backup saved to ${backupPath} (Rotation active).`;
        } catch {
            backupInfo = 'New file created (no backup needed).';
        }

        await fs.writeFile(fullPath, newContent, 'utf-8');
        
        await appendAuditLog({
          action: 'SELF_UPDATE_CORE',
          file: filePath,
          reason: reason,
          backup: backupInfo,
          status: 'SUCCESS'
        });

        return `CORE UPDATE SUCCESS: Written to ${filePath}.\n${backupInfo}\nReason: ${reason}\nNOTE: Restart required for changes to take effect.`;
      } catch (error: any) {
        await appendAuditLog({
          action: 'SELF_UPDATE_CORE',
          file: filePath,
          reason: reason,
          status: 'FAILED'
        });
        return `CORE UPDATE FAILED: ${error.message}`;
      }
    }
  },
  {
    name: 'rewrite_core_identity',
    description: 'Allows ARIA to evolve its own psychology by appending new rules or lessons to its System Prompt.',
    parameters: [
      {
        name: 'newRule',
        type: 'string',
        description: 'The new rule, lesson, or behavior to adopt (e.g. "Always verify JSON syntax")',
        required: true
      }
    ],
    execute: async ({ newRule }) => {
      try {
        const dynamicPath = path.join(process.cwd(), 'aria-data', 'dynamic-prompt.txt');
        
        // Append with timestamp
        const entry = `\n[Evolved at ${new Date().toISOString()}] RULE: ${newRule}`;
        
        await fs.mkdir(path.dirname(dynamicPath), { recursive: true });
        await fs.appendFile(dynamicPath, entry, 'utf-8');
        
        return `IDENTITY EVOLVED. New rule added to dynamic-prompt.txt: "${newRule}"`;
      } catch (e: any) {
        return `EVOLUTION FAILED: ${e.message}`;
      }
    }
  },
  {
    name: 'system_rebuild_and_restart',
    description: 'Compiles the updated code and restarts the ARIA process. Used after self_update_core.',
    parameters: [],
    execute: async () => {
      try {
        // Trigger Watchdog script
        const script = `
          echo "Initiating ARIA Watchdog & Rebuild..."
          # Run watchdog script (compiles tsx on the fly)
          npx tsx scripts/watchdog.ts
        `;
        
        // Execute in background
        exec(script);
        
        return "SYSTEM REBUILD INITIATED via Watchdog. If build fails, rollback will occur automatically.";
      } catch (error: any) {
        return `REBUILD FAILED: ${error.message}`;
      }
    }
  }
];
