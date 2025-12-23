import { Tool } from '../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const macOSTools: Tool[] = [
  {
    name: 'get_active_window',
    description: 'Get the title of the currently active window on macOS.',
    parameters: [],
    execute: async () => {
      const script = `
        global frontApp, frontAppName, windowTitle
        set windowTitle to ""
        tell application "System Events"
          set frontApp to first application process whose frontmost is true
          set frontAppName to name of frontApp
          tell process frontAppName
            try
              set windowTitle to name of front window
            end try
          end tell
        end tell
        return frontAppName & " - " & windowTitle
      `;
      try {
        const { stdout } = await execAsync(`osascript -e '${script}'`);
        return stdout.trim();
      } catch (error: any) {
        return `Error getting active window: ${error.message}`;
      }
    }
  },
  {
    name: 'list_running_apps',
    description: 'List all running visible applications on macOS.',
    parameters: [],
    execute: async () => {
      const script = `
        tell application "System Events"
          set appList to name of every process whose visible is true
        end tell
        return appList
      `;
      try {
        const { stdout } = await execAsync(`osascript -e '${script}'`);
        return stdout.trim();
      } catch (error: any) {
        return `Error listing apps: ${error.message}`;
      }
    }
  },
  {
    name: 'open_app',
    description: 'Open a macOS application by name.',
    parameters: [
      {
        name: 'appName',
        type: 'string',
        description: 'The name of the application to open (e.g., "Safari", "Terminal")',
        required: true
      }
    ],
    execute: async ({ appName }) => {
      try {
        await execAsync(`open -a "${appName}"`);
        return `Opened ${appName}`;
      } catch (error: any) {
        return `Error opening app: ${error.message}`;
      }
    }
  },
  {
    name: 'speak_text',
    description: 'Make the Mac speak text out loud.',
    parameters: [
      {
        name: 'text',
        type: 'string',
        description: 'The text to speak',
        required: true
      }
    ],
    execute: async ({ text }) => {
      try {
        // Sanitizing input slightly to avoid shell injection, though 'say' is relatively safe
        const safeText = text.replace(/"/g, '\\"');
        await execAsync(`say "${safeText}"`);
        return `Spoke: "${text}"`;
      } catch (error: any) {
        return `Error speaking: ${error.message}`;
      }
    }
  },
  {
    name: 'run_applescript',
    description: 'Execute raw AppleScript code. POWERFUL: Allows full control of the Mac UI.',
    parameters: [
      {
        name: 'script',
        type: 'string',
        description: 'The AppleScript code to execute',
        required: true
      }
    ],
    execute: async ({ script }) => {
      try {
        // Escape single quotes for shell safety
        const safeScript = script.replace(/'/g, "'\\''");
        const { stdout, stderr } = await execAsync(`osascript -e '${safeScript}'`);
        return stdout || stderr || 'Script executed successfully';
      } catch (error: any) {
        return `AppleScript error: ${error.message}`;
      }
    }
  }
];
