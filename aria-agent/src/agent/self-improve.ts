import { ExecutionLog, Improvement, PerformanceReport, Tool } from '../types.js';
import { Memory } from '../memory/index.js';
import { OllamaProvider } from '../providers/ollama.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { loadDynamicTools } from '../tools/index.js';

export class SelfImprovement {
  private memory: Memory;
  private provider: OllamaProvider;
  private dataDir: string;
  private improvementsFile: string;
  private dynamicToolsFile: string;
  private backupsDir: string;

  constructor(memory: Memory, provider: OllamaProvider, dataDir: string = './aria-data') {
    this.memory = memory;
    this.provider = provider;
    this.dataDir = dataDir;
    this.improvementsFile = path.join(dataDir, 'improvements.json');
    this.dynamicToolsFile = path.join(dataDir, 'dynamic-tools.json');
    this.backupsDir = path.join(dataDir, 'backups');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.backupsDir, { recursive: true });
    // Ensure dynamic tools file exists
    try {
      await fs.access(this.dynamicToolsFile);
    } catch {
      await fs.writeFile(this.dynamicToolsFile, '[]');
    }
  }

  async analyzePerformance(): Promise<PerformanceReport> {
    const logs = await this.memory.getExecutionLogs(100);

    if (logs.length === 0) {
      return {
        totalTasks: 0,
        successRate: 0,
        avgDuration: 0,
        commonFailures: [],
        toolUsage: []
      };
    }

    const successCount = logs.filter(l => l.success).length;
    const totalDuration = logs.reduce((sum, l) => sum + l.duration, 0);

    const failureReasons: Map<string, number> = new Map();
    const toolStats: Map<string, { count: number; successes: number }> = new Map();

    for (const log of logs) {
      if (!log.success && log.error) {
        const reason = this.categorizeError(log.error);
        failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      }

      for (const step of log.steps) {
        const toolName = step.action.tool;
        const stats = toolStats.get(toolName) || { count: 0, successes: 0 };
        stats.count++;
        if (!step.observation.toLowerCase().includes('error')) {
          stats.successes++;
        }
        toolStats.set(toolName, stats);
      }
    }

    return {
      totalTasks: logs.length,
      successRate: successCount / logs.length,
      avgDuration: totalDuration / logs.length,
      commonFailures: Array.from(failureReasons.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      toolUsage: Array.from(toolStats.entries())
        .map(([tool, stats]) => ({
          tool,
          count: stats.count,
          successRate: stats.successes / stats.count
        }))
        .sort((a, b) => b.count - a.count)
    };
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout')) return 'Timeout';
    if (error.includes('not found') || error.includes('ENOENT')) return 'File not found';
    if (error.includes('permission')) return 'Permission denied';
    if (error.includes('network') || error.includes('fetch')) return 'Network error';
    if (error.includes('parse') || error.includes('JSON')) return 'Parse error';
    if (error.includes('Max iterations')) return 'Task too complex';
    return 'Other';
  }

  async suggestImprovements(): Promise<Improvement[]> {
    const performance = await this.analyzePerformance();
    const improvements: Improvement[] = [];

    if (performance.successRate < 0.7) {
      improvements.push({
        id: uuid(),
        type: 'prompt',
        description: 'Add more examples to system prompt for better task understanding',
        changes: []
      });
    }

    for (const failure of performance.commonFailures) {
      if (failure.count >= 3) {
        improvements.push({
          id: uuid(),
          type: 'tool',
          description: `Create error handling for: ${failure.reason}`,
          changes: []
        });
      }
    }

    for (const tool of performance.toolUsage) {
      if (tool.successRate < 0.5 && tool.count >= 5) {
        improvements.push({
          id: uuid(),
          type: 'tool',
          description: `Improve ${tool.tool} tool - low success rate (${(tool.successRate * 100).toFixed(0)}%)`,
          changes: []
        });
      }
    }

    return improvements;
  }

  async generateNewTool(description: string): Promise<Tool | null> {
    const prompt = `You are generating a new tool for an AI agent. The tool should be in TypeScript format.

Description of needed tool: ${description}

Generate a tool definition following this exact interface:
\`\`\`typescript
{
  name: string;           // lowercase_snake_case
  description: string;    // Clear description of what the tool does
  parameters: [{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
  }];
  execute: async function that takes params object and returns string
}
\`\`\`

Respond with ONLY the tool definition as valid JSON (the execute function as a string of code).`;

    try {
      const response = await this.provider.generate(prompt);
      const jsonMatch = response.match(/```(?:json|typescript)?\s*([\s\S]*?)\s*```/);

      if (jsonMatch) {
        const toolDef = JSON.parse(jsonMatch[1]);
        const executeCode = toolDef.execute || toolDef.executeCode;

        // Save for persistence
        await this.saveDynamicTool({
          name: toolDef.name,
          description: toolDef.description,
          parameters: toolDef.parameters,
          executeCode: executeCode
        });

        const tool: Tool = {
          name: toolDef.name,
          description: toolDef.description,
          parameters: toolDef.parameters,
          execute: new Function('params', `return (async () => { ${executeCode} })()`) as any
        };

        return tool;
      }
    } catch (error) {
      console.error('Failed to generate tool:', error);
    }

    return null;
  }

  private async saveDynamicTool(toolDef: any): Promise<void> {
    try {
      const content = await fs.readFile(this.dynamicToolsFile, 'utf-8');
      const tools = JSON.parse(content);
      
      // Update or add
      const index = tools.findIndex((t: any) => t.name === toolDef.name);
      if (index >= 0) {
        tools[index] = toolDef;
      } else {
        tools.push(toolDef);
      }
      
      await fs.writeFile(this.dynamicToolsFile, JSON.stringify(tools, null, 2));
      
      // Reload in memory
      await loadDynamicTools(this.dataDir);
    } catch (error) {
      console.error('Failed to save dynamic tool:', error);
    }
  }

  async saveImprovement(improvement: Improvement): Promise<void> {
    let improvements: Improvement[] = [];
    try {
      const content = await fs.readFile(this.improvementsFile, 'utf-8');
      improvements = JSON.parse(content);
    } catch {
      improvements = [];
    }

    improvement.appliedAt = Date.now();
    improvements.push(improvement);

    await fs.writeFile(this.improvementsFile, JSON.stringify(improvements, null, 2));
  }

  async getImprovementHistory(): Promise<Improvement[]> {
    try {
      const content = await fs.readFile(this.improvementsFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async createBackup(label: string): Promise<string> {
    const timestamp = Date.now();
    const backupPath = path.join(this.backupsDir, `backup-${label}-${timestamp}`);
    await fs.mkdir(backupPath, { recursive: true });

    const data = await this.memory.exportData();
    await fs.writeFile(
      path.join(backupPath, 'data.json'),
      JSON.stringify(data, null, 2)
    );

    return backupPath;
  }

  async restoreBackup(backupPath: string): Promise<void> {
    const content = await fs.readFile(path.join(backupPath, 'data.json'), 'utf-8');
    const data = JSON.parse(content);
    await this.memory.importData(data);
  }

  async listBackups(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.backupsDir);
      return entries.filter(e => e.startsWith('backup-'));
    } catch {
      return [];
    }
  }
}
