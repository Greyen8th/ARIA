import { Tool } from '../types.js';
import { fileTools } from './file.js';
import { codeTools } from './code.js';
import { webTools } from './web.js';
import { macOSTools } from './macos.js';
import { alphaTools } from './alpha.js';
import { evolutionTools } from './evolution.js';
import { osAutomationTools } from './os-automation.js';
import { sandboxTools } from './sandbox.js';
import { uiFabricatorTools } from './ui-fabricator.js';
import { searchTools, editorTools, updaterTools } from './missing_placeholders.js';
import { visionTools } from './vision.js';
import { macosVisionTool } from './macos-vision.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Core tools that are always available
export const coreTools: Tool[] = [
  ...fileTools,
  ...codeTools,
  ...webTools,
  ...macOSTools,
  ...alphaTools,
  ...evolutionTools,
  ...osAutomationTools,
  ...sandboxTools,
  ...uiFabricatorTools,
  ...searchTools,
  ...editorTools,
  ...updaterTools,
  ...visionTools,
  macosVisionTool
];

// Dynamic tools container
let dynamicTools: Tool[] = [];

export async function loadDynamicTools(dataDir: string = './aria-data'): Promise<void> {
  const toolsPath = path.join(dataDir, 'dynamic-tools.json');
  try {
    const content = await fs.readFile(toolsPath, 'utf-8');
    const toolDefs = JSON.parse(content);
    
    dynamicTools = toolDefs.map((def: any) => ({
      name: def.name,
      description: def.description,
      parameters: def.parameters,
      // Rehydrate the execute function from string
      execute: new Function('params', `return (async () => { ${def.executeCode} })()`)
    }));
    
    console.log(`Loaded ${dynamicTools.length} dynamic tools.`);
  } catch (error) {
    // If file doesn't exist or error parsing, start with empty list
    dynamicTools = [];
  }
}

export function getAllTools(): Tool[] {
  return [...coreTools, ...dynamicTools];
}

export function getToolByName(name: string): Tool | undefined {
  return getAllTools().find(t => t.name === name);
}

export function getToolDescriptions(): string {
  return getAllTools()
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');
}

// Re-export specific groups if needed
export { fileTools, codeTools, webTools, macOSTools, alphaTools, evolutionTools, osAutomationTools, searchTools, editorTools, updaterTools, visionTools, macosVisionTool };
