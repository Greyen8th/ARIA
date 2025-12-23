import { Tool } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const sandboxTools: Tool[] = [
  {
    name: 'run_safe_experiment',
    description: 'Execute code in a temporary sandbox environment. Useful for testing new libraries or snippets safely.',
    parameters: [
      {
        name: 'code',
        type: 'string',
        description: 'The TypeScript/JavaScript code to run',
        required: true
      },
      {
        name: 'dependencies',
        type: 'string', // Comma separated
        description: 'List of npm dependencies to install (e.g. "chalk,lodash")',
        required: false
      }
    ],
    execute: async ({ code, dependencies }) => {
      const sandboxId = Date.now().toString();
      const sandboxDir = path.join(process.cwd(), 'aria-data', 'sandbox', sandboxId);

      try {
        // 1. Create Sandbox Dir
        await fs.mkdir(sandboxDir, { recursive: true });

        // 2. Initialize Package
        await execAsync('npm init -y', { cwd: sandboxDir });

        // 3. Install Deps
        if (dependencies) {
           const deps = dependencies.split(',').map((d: string) => d.trim()).join(' ');
           await execAsync(`npm install ${deps}`, { cwd: sandboxDir });
        }

        // 4. Write Code
        const scriptPath = path.join(sandboxDir, 'experiment.ts');
        await fs.writeFile(scriptPath, code, 'utf-8');

        // 5. Run Code (using tsx or node)
        // We use npx tsx to run typescript directly
        const { stdout, stderr } = await execAsync(`npx tsx ${scriptPath}`, { 
            cwd: sandboxDir,
            timeout: 30000 // 30s timeout
        });

        // 6. Cleanup (Optional: keep if failed for debugging, but we delete to save space usually)
        // await fs.rm(sandboxDir, { recursive: true, force: true });

        return `EXPERIMENT SUCCESS:\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`;

      } catch (error: any) {
        return `EXPERIMENT FAILED:\nError: ${error.message}\n${error.stdout ? `STDOUT: ${error.stdout}` : ''}\n${error.stderr ? `STDERR: ${error.stderr}` : ''}`;
      }
    }
  }
];
