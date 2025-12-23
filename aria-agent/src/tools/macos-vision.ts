import { Tool } from '../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const macosVisionTool: Tool = {
  name: 'macos_get_ui_tree',
  description: 'Scan the current active window on macOS to find buttons, inputs, and their coordinates. Use this instead of screenshots for faster interaction.',
  parameters: [
    {
      name: 'app_name',
      type: 'string',
      description: 'Optional: Focus on specific app (e.g., "Google Chrome", "System Settings")',
      required: false
    }
  ],
  execute: async ({ app_name }) => {
    // JXA Script to get UI elements
    const script = `
      var SystemEvents = Application("SystemEvents");
      var process = ${app_name ? `SystemEvents.processes["${app_name}"]` : `SystemEvents.processes.whose({frontmost: true})[0]`};
      
      if (!process) return JSON.stringify({ error: "Process not found" });

      var window = process.windows[0];
      if (!window) return JSON.stringify({ error: "No window found" });

      function scan(element, depth) {
          if (depth > 2) return []; // Limit depth for performance
          
          var items = [];
          try {
              var uiElems = element.uiElements();
              for (var i = 0; i < uiElems.length; i++) {
                  var el = uiElems[i];
                  var role = el.role();
                  var title = el.title() || el.name() || "";
                  
                  if (role === "AXButton" || role === "AXTextField" || role === "AXLink" || role === "AXStaticText") {
                      var pos = el.position();
                      var size = el.size();
                      items.push({
                          role: role,
                          title: title,
                          x: pos[0] + (size[0]/2), // Center X
                          y: pos[1] + (size[1]/2)  // Center Y
                      });
                  }
                  
                  // Recursive scan for containers
                  if (role === "AXGroup" || role === "AXScrollArea" || role === "AXSplitGroup") {
                      items = items.concat(scan(el, depth + 1));
                  }
              }
          } catch(e) {}
          return items;
      }

      var elements = scan(window, 0);
      JSON.stringify({ app: process.name(), window: window.name(), elements: elements });
    `;

    try {
      // Execute JXA via osascript
      const { stdout } = await execAsync(`osascript -l JavaScript -e '${script}'`);
      const data = JSON.parse(stdout.trim());
      
      if (data.error) return `Error: ${data.error}`;
      
      // Format for LLM
      let report = `App: ${data.app}\nWindow: ${data.window}\nElements:\n`;
      data.elements.slice(0, 50).forEach((el: any) => {
          report += `- [${el.role}] "${el.title}" at (x:${Math.round(el.x)}, y:${Math.round(el.y)})\n`;
      });
      
      if (data.elements.length > 50) report += `...and ${data.elements.length - 50} more elements.`;
      
      return report;
      
    } catch (error: any) {
      return `Matrix Vision Failed: ${error.message}. Ensure Accessibility permissions are granted to Terminal/VSCode.`;
    }
  }
};
