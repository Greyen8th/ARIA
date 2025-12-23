import { Tool } from '../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as vm from 'vm';

const execAsync = promisify(exec);

export const executeJavaScriptTool: Tool = {
  name: 'execute_javascript',
  description: 'Execute JavaScript code and return the output. Has access to console.log for output.',
  parameters: [
    {
      name: 'code',
      type: 'string',
      description: 'The JavaScript code to execute',
      required: true
    }
  ],
  async execute({ code }) {
    try {
      const output: string[] = [];
      const sandbox = {
        console: {
          log: (...args: any[]) => output.push(args.map(String).join(' ')),
          error: (...args: any[]) => output.push('[ERROR] ' + args.map(String).join(' ')),
          warn: (...args: any[]) => output.push('[WARN] ' + args.map(String).join(' '))
        },
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        JSON,
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Error,
        Map,
        Set,
        Promise,
        fetch
      };

      const script = new vm.Script(code);
      const context = vm.createContext(sandbox);
      const result = script.runInContext(context, { timeout: 30000 });

      if (result !== undefined && output.length === 0) {
        output.push(String(result));
      }

      return output.join('\n') || 'Code executed successfully (no output)';
    } catch (error: any) {
      return `Execution error: ${error.message}`;
    }
  }
};

export const executePythonTool: Tool = {
  name: 'execute_python',
  description: 'Execute Python code and return the output',
  parameters: [
    {
      name: 'code',
      type: 'string',
      description: 'The Python code to execute',
      required: true
    }
  ],
  async execute({ code }) {
    try {
      const { stdout, stderr } = await execAsync(`python3 -c "${code.replace(/"/g, '\\"')}"`, {
        timeout: 30000
      });
      return stdout || stderr || 'Code executed successfully (no output)';
    } catch (error: any) {
      return `Execution error: ${error.message}`;
    }
  }
};

export const shellCommandTool: Tool = {
  name: 'shell_command',
  description: 'Execute a shell command and return the output. Use with caution!',
  parameters: [
    {
      name: 'command',
      type: 'string',
      description: 'The shell command to execute',
      required: true
    },
    {
      name: 'cwd',
      type: 'string',
      description: 'Working directory for the command',
      required: false
    }
  ],
  async execute({ command, cwd }) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || process.cwd(),
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024
      });
      const output = stdout + (stderr ? `\n[stderr]: ${stderr}` : '');
      return output || 'Command executed successfully (no output)';
    } catch (error: any) {
      return `Command error: ${error.message}`;
    }
  }
};

export const npmCommandTool: Tool = {
  name: 'npm_command',
  description: 'Execute npm commands (install, run, etc.)',
  parameters: [
    {
      name: 'args',
      type: 'string',
      description: 'The npm arguments (e.g., "install express" or "run build")',
      required: true
    },
    {
      name: 'cwd',
      type: 'string',
      description: 'Working directory for the command',
      required: false
    }
  ],
  async execute({ args, cwd }) {
    try {
      const { stdout, stderr } = await execAsync(`npm ${args}`, {
        cwd: cwd || process.cwd(),
        timeout: 300000,
        maxBuffer: 10 * 1024 * 1024
      });
      return stdout + (stderr ? `\n${stderr}` : '');
    } catch (error: any) {
      return `NPM error: ${error.message}`;
    }
  }
};

export const gitCommandTool: Tool = {
  name: 'git_command',
  description: 'Execute git commands',
  parameters: [
    {
      name: 'args',
      type: 'string',
      description: 'The git arguments (e.g., "status" or "commit -m message")',
      required: true
    },
    {
      name: 'cwd',
      type: 'string',
      description: 'Working directory for the command',
      required: false
    }
  ],
  async execute({ args, cwd }) {
    try {
      const { stdout, stderr } = await execAsync(`git ${args}`, {
        cwd: cwd || process.cwd(),
        timeout: 60000
      });
      return stdout + (stderr ? `\n${stderr}` : '');
    } catch (error: any) {
      return `Git error: ${error.message}`;
    }
  }
};

export const gitCloneTool: Tool = {
    name: 'git_clone',
    description: 'Clone a git repository to a specific directory.',
    parameters: [
        {
            name: 'repoUrl',
            type: 'string',
            description: 'The URL of the repository to clone',
            required: true
        },
        {
            name: 'targetDir',
            type: 'string',
            description: 'The target directory name (relative to current working directory or absolute)',
            required: false
        }
    ],
    execute: async ({ repoUrl, targetDir }) => {
        try {
            const target = targetDir ? ` "${targetDir}"` : '';
            const { stdout, stderr } = await execAsync(`git clone "${repoUrl}"${target}`, {
                timeout: 300000 // 5 mins
            });
            return stdout + (stderr ? `\n${stderr}` : '');
        } catch (error: any) {
            return `Git clone error: ${error.message}`;
        }
    }
};

export const codeTools = [
  executeJavaScriptTool,
  executePythonTool,
  shellCommandTool,
  npmCommandTool,
  gitCommandTool,
  gitCloneTool
];
