import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { ZipWriter, BlobWriter, TextReader } from "npm:@zip.js/zip.js@2.7.32";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const files: Record<string, string> = {
"aria-agent/package.json": `{
  "name": "aria-agent",
  "version": "1.0.0",
  "description": "ARIA - Autonomous Reasoning Intelligence Agent",
  "main": "electron/main.js",
  "type": "module",
  "author": "ARIA Team",
  "license": "MIT",
  "scripts": {
    "start": "node dist/main.js",
    "build": "tsc",
    "dev": "tsx src/main.ts",
    "ui": "tsx src/server.ts",
    "electron": "electron .",
    "electron:dev": "concurrently \\"tsx src/server.ts\\" \\"wait-on http://localhost:3847 && electron .\\"",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "dist:mac": "electron-builder --mac",
    "dist:win": "electron-builder --win",
    "dist:linux": "electron-builder --linux"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "express": "^4.18.2",
    "node-fetch": "^3.3.2",
    "readline": "^1.3.0",
    "uuid": "^9.0.0",
    "ws": "^8.14.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/uuid": "^9.0.7",
    "@types/ws": "^8.5.10",
    "concurrently": "^8.2.2",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "tsx": "^4.6.2",
    "typescript": "^5.3.2",
    "wait-on": "^7.2.0"
  },
  "build": {
    "appId": "com.aria.agent",
    "productName": "ARIA"
  }
}`,
"aria-agent/tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
"aria-agent/README.md": `# ARIA - Autonomous Reasoning Intelligence Agent

## Quick Start

\`\`\`bash
cd aria-agent
./start.sh
\`\`\`

## Requirements

- Node.js 18+ (https://nodejs.org)
- Ollama (https://ollama.ai)

## Manual Installation

\`\`\`bash
# Install Ollama
brew install ollama

# Start Ollama and download model
ollama serve
ollama pull llama3.2:3b

# Install and start ARIA
cd aria-agent
npm install
npm run ui
\`\`\`

Open http://localhost:3847`,
"aria-agent/start.sh": `#!/bin/bash
clear
echo "ARIA - Autonomous Reasoning Intelligence Agent"
echo "=========================================\n"
SCRIPT_DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found! Install from https://nodejs.org"
    exit 1
fi
if ! command -v ollama &> /dev/null; then
    echo "[WARNING] Ollama not installed. Install from https://ollama.ai"
else
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "[...] Starting Ollama server..."
        ollama serve > /dev/null 2>&1 &
        sleep 3
    fi
fi
if [ ! -d "node_modules" ]; then
    echo "[...] Installing dependencies..."
    npm install --silent
fi
echo "Opening: http://localhost:3847"
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2 && open "http://localhost:3847" &
fi
npx tsx src/server.ts`,
"aria-agent/src/types.ts": `export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp?: number;
  toolName?: string;
  toolResult?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>) => Promise<string>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[];
}

export interface AgentAction {
  tool: string;
  params: Record<string, any>;
  reasoning: string;
}

export interface AgentStep {
  action: AgentAction;
  observation: string;
  timestamp: number;
}

export interface ExecutionLog {
  id: string;
  task: string;
  steps: AgentStep[];
  result: string;
  success: boolean;
  duration: number;
  timestamp: number;
  error?: string;
  provider?: string;
}

export interface ModelConfig {
  name: string;
  provider: 'ollama' | 'openai' | 'anthropic';
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
}

export interface Improvement {
  id: string;
  type: 'prompt' | 'tool' | 'config';
  description: string;
  changes: Change[];
  appliedAt?: number;
}

export interface Change {
  type: 'modify' | 'create' | 'delete';
  filePath: string;
  oldContent?: string;
  newContent?: string;
}

export interface PerformanceReport {
  totalTasks: number;
  successRate: number;
  avgDuration: number;
  commonFailures: { reason: string; count: number }[];
  toolUsage: { tool: string; count: number; successRate: number }[];
}`,
"aria-agent/src/main.ts": `import * as readline from 'readline';
import chalk from 'chalk';
import { OllamaProvider } from './providers/ollama.js';
import { Memory } from './memory/index.js';
import { AgentExecutor } from './agent/executor.js';
import { SelfImprovement } from './agent/self-improve.js';
import { allTools } from './tools/index.js';

const RECOMMENDED_MODELS = [
  { name: 'llama3.2:3b', description: 'Fast, general purpose (2GB)' },
  { name: 'llama3.2:1b', description: 'Very fast, basic tasks (1GB)' },
  { name: 'codellama:7b', description: 'Coding specialist (4GB)' },
  { name: 'deepseek-coder:6.7b', description: 'Advanced coding (4GB)' },
  { name: 'mistral:7b', description: 'Balanced performance (4GB)' },
];

async function main() {
  console.log(chalk.cyan('\\n===================================='));
  console.log(chalk.cyan.bold('   ARIA - AI Agent'));
  console.log(chalk.cyan('====================================\\n'));

  const provider = new OllamaProvider({
    name: 'llama3.2:3b',
    provider: 'ollama',
    temperature: 0.7,
    contextWindow: 8192
  });

  console.log(chalk.yellow('Checking Ollama connection...'));
  const isAvailable = await provider.isAvailable();

  if (!isAvailable) {
    console.log(chalk.red('\\nOllama is not running!'));
    console.log(chalk.white('\\nTo start Ollama:'));
    console.log(chalk.gray('  1. Install from https://ollama.ai'));
    console.log(chalk.gray('  2. Run: ollama serve'));
    console.log(chalk.gray('  3. Pull a model: ollama pull llama3.2:3b'));
    process.exit(1);
  }

  console.log(chalk.green('Ollama connected!\\n'));

  const models = await provider.listModels();
  if (models.length === 0) {
    console.log(chalk.yellow('No models found. Pulling recommended model...'));
    await provider.pullModel('llama3.2:3b');
  }

  const memory = new Memory('./aria-data', 50);
  await memory.initialize();

  const executor = new AgentExecutor({
    provider,
    memory,
    tools: allTools,
    maxIterations: 15,
    verbose: false
  });

  const selfImprove = new SelfImprovement(memory, provider, './aria-data');
  await selfImprove.initialize();

  console.log(chalk.cyan('\\n===================================='));
  console.log(chalk.white('Commands: /help /tools /models /stats /improve /clear /exit'));
  console.log(chalk.cyan('====================================\\n'));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const prompt = () => {
    rl.question(chalk.cyan('\\nYou: '), async (input) => {
      const trimmed = input.trim();
      if (!trimmed) { prompt(); return; }
      if (trimmed === '/exit') { console.log(chalk.cyan('\\nGoodbye!\\n')); process.exit(0); }

      console.log(chalk.yellow('\\nARIA is thinking...'));
      try {
        const result = await executor.execute(trimmed, (step) => {
          console.log(chalk.gray(\`  [\${step.action.tool}] \${step.action.reasoning.slice(0, 100)}...\`));
        });
        console.log(chalk.green('\\nARIA: ') + result);
      } catch (error: any) {
        console.log(chalk.red('\\nError: ') + error.message);
      }
      prompt();
    });
  };

  prompt();
}

main().catch(console.error);`,
"aria-agent/src/server.ts": `import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { OllamaProvider } from './providers/ollama.js';
import { Memory } from './memory/index.js';
import { AgentExecutor } from './agent/executor.js';
import { SelfImprovement } from './agent/self-improve.js';
import { allTools } from './tools/index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

let provider: OllamaProvider;
let memory: Memory;
let executor: AgentExecutor;
let selfImprove: SelfImprovement;
let currentModel = 'llama3.2:3b';

async function initializeAgent() {
  provider = new OllamaProvider({
    name: currentModel,
    provider: 'ollama',
    temperature: 0.7,
    contextWindow: 8192
  });

  memory = new Memory('./aria-data', 50);
  await memory.initialize();

  executor = new AgentExecutor({
    provider,
    memory,
    tools: allTools,
    maxIterations: 15,
    verbose: true
  });

  selfImprove = new SelfImprovement(memory, provider, './aria-data');
  await selfImprove.initialize();
}

app.get('/api/status', async (req, res) => {
  const available = await provider.isAvailable();
  const models = available ? await provider.listModels() : [];
  res.json({
    ollama: available,
    currentModel,
    availableModels: models,
    tools: allTools.map(t => ({ name: t.name, description: t.description }))
  });
});

app.get('/api/models', async (req, res) => {
  const models = await provider.listModels();
  res.json({ models });
});

app.post('/api/model', async (req, res) => {
  const { model } = req.body;
  currentModel = model;
  provider = new OllamaProvider({ name: model, provider: 'ollama', temperature: 0.7, contextWindow: 8192 });
  executor = new AgentExecutor({ provider, memory, tools: allTools, maxIterations: 15, verbose: true });
  res.json({ success: true, model });
});

app.get('/api/history', async (req, res) => {
  const messages = memory.getMessages();
  res.json({ messages });
});

app.post('/api/clear', async (req, res) => {
  await memory.clear();
  res.json({ success: true });
});

app.get('/api/performance', async (req, res) => {
  const report = await selfImprove.analyzePerformance();
  res.json(report);
});

app.get('/api/improvements', async (req, res) => {
  const suggestions = await selfImprove.suggestImprovements();
  const history = await selfImprove.getImprovementHistory();
  res.json({ suggestions, history });
});

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'execute') {
        ws.send(JSON.stringify({ type: 'status', status: 'thinking' }));
        const result = await executor.execute(message.task, (step) => {
          ws.send(JSON.stringify({
            type: 'step',
            step: { tool: step.action.tool, params: step.action.params, reasoning: step.action.reasoning, result: step.observation.slice(0, 1000) }
          }));
        });
        ws.send(JSON.stringify({ type: 'result', result }));
      }
    } catch (error: any) {
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 3847;

initializeAgent().then(() => {
  server.listen(PORT, () => {
    console.log('\\n====================================');
    console.log('   ARIA Agent Server Running');
    console.log('====================================');
    console.log(\`\\nOpen http://localhost:\${PORT} in your browser\`);
    console.log('\\nMake sure Ollama is running: ollama serve');
  });
});`,
"aria-agent/src/memory/index.ts": `import { Message, ExecutionLog } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class Memory {
  private messages: Message[] = [];
  private maxMessages: number;
  private dataDir: string;
  private conversationFile: string;
  private logsFile: string;

  constructor(dataDir: string = './aria-data', maxMessages: number = 50) {
    this.dataDir = dataDir;
    this.maxMessages = maxMessages;
    this.conversationFile = path.join(dataDir, 'conversation.json');
    this.logsFile = path.join(dataDir, 'execution-logs.json');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await this.loadConversation();
  }

  private async loadConversation(): Promise<void> {
    try {
      const content = await fs.readFile(this.conversationFile, 'utf-8');
      const data = JSON.parse(content);
      this.messages = data.messages || [];
    } catch {
      this.messages = [];
    }
  }

  private async saveConversation(): Promise<void> {
    await fs.writeFile(this.conversationFile, JSON.stringify({ messages: this.messages, updatedAt: Date.now() }, null, 2));
  }

  async addMessage(message: Message): Promise<void> {
    message.timestamp = Date.now();
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
    await this.saveConversation();
  }

  async addUserMessage(content: string): Promise<void> {
    await this.addMessage({ role: 'user', content });
  }

  async addAssistantMessage(content: string): Promise<void> {
    await this.addMessage({ role: 'assistant', content });
  }

  async addToolResult(toolName: string, result: string): Promise<void> {
    await this.addMessage({ role: 'tool', content: result, toolName });
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getRecentMessages(count: number): Message[] {
    return this.messages.slice(-count);
  }

  async clear(): Promise<void> {
    this.messages = [];
    await this.saveConversation();
  }

  async logExecution(log: ExecutionLog): Promise<void> {
    let logs: ExecutionLog[] = [];
    try {
      const content = await fs.readFile(this.logsFile, 'utf-8');
      logs = JSON.parse(content);
    } catch { logs = []; }
    logs.push(log);
    if (logs.length > 1000) logs = logs.slice(-1000);
    await fs.writeFile(this.logsFile, JSON.stringify(logs, null, 2));
  }

  async getExecutionLogs(limit?: number): Promise<ExecutionLog[]> {
    try {
      const content = await fs.readFile(this.logsFile, 'utf-8');
      const logs: ExecutionLog[] = JSON.parse(content);
      return limit ? logs.slice(-limit) : logs;
    } catch { return []; }
  }

  async getSuccessRate(): Promise<number> {
    const logs = await this.getExecutionLogs(100);
    if (logs.length === 0) return 0;
    const successful = logs.filter(l => l.success).length;
    return successful / logs.length;
  }

  async exportData(): Promise<{ conversation: Message[]; logs: ExecutionLog[] }> {
    const logs = await this.getExecutionLogs();
    return { conversation: this.messages, logs };
  }

  async importData(data: { conversation?: Message[]; logs?: ExecutionLog[] }): Promise<void> {
    if (data.conversation) {
      this.messages = data.conversation;
      await this.saveConversation();
    }
    if (data.logs) {
      await fs.writeFile(this.logsFile, JSON.stringify(data.logs, null, 2));
    }
  }
}`,
"aria-agent/src/providers/ollama.ts": `import { ModelConfig, Message, Tool } from '../types.js';
import { buildSystemPrompt } from '../brain/index.js';

export class OllamaProvider {
  private config: ModelConfig;
  private baseUrl: string;

  constructor(config: ModelConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/tags\`);
      return response.ok;
    } catch { return false; }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/tags\`);
      const data = await response.json() as { models?: { name: string }[] };
      return data.models?.map(m => m.name) || [];
    } catch { return []; }
  }

  async pullModel(modelName: string): Promise<void> {
    console.log(\`Downloading model \${modelName}...\`);
    const response = await fetch(\`\${this.baseUrl}/api/pull\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: false })
    });
    if (!response.ok) throw new Error(\`Failed to pull model: \${await response.text()}\`);
    console.log(\`Model \${modelName} ready!\`);
  }

  async chat(messages: Message[], tools?: Tool[]): Promise<string> {
    const systemPrompt = buildSystemPrompt(tools || []);
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: m.role === 'tool' ? \`[Tool Result - \${m.toolName}]: \${m.content}\` : m.content
      }))
    ];

    const response = await fetch(\`\${this.baseUrl}/api/chat\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.name,
        messages: formattedMessages,
        stream: false,
        options: {
          temperature: this.config.temperature ?? 0.7,
          num_ctx: this.config.contextWindow ?? 8192,
          num_predict: this.config.maxTokens ?? 4096
        }
      })
    });

    if (!response.ok) throw new Error(\`Ollama error: \${await response.text()}\`);
    const data = await response.json() as { message?: { content: string } };
    return data.message?.content || '';
  }

  async generate(prompt: string): Promise<string> {
    const response = await fetch(\`\${this.baseUrl}/api/generate\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.name,
        prompt,
        stream: false,
        options: {
          temperature: this.config.temperature ?? 0.7,
          num_ctx: this.config.contextWindow ?? 8192,
          num_predict: this.config.maxTokens ?? 4096
        }
      })
    });
    if (!response.ok) throw new Error(\`Ollama error: \${await response.text()}\`);
    const data = await response.json() as { response?: string };
    return data.response || '';
  }
}`,
"aria-agent/src/providers/multi-provider.ts": `import { OllamaProvider } from './ollama.js';

export interface ProviderConfig {
  name: string;
  type: 'ollama' | 'groq' | 'together' | 'huggingface' | 'openrouter';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  freeModels?: string[];
  priority: number;
  rateLimit?: { requests: number; window: number };
  status: 'active' | 'blocked' | 'rate_limited' | 'unknown';
  lastError?: string;
  lastUsed?: number;
}

export interface ProviderResponse {
  content: string;
  provider: string;
  model: string;
  tokens?: { input: number; output: number };
  latency: number;
}

const BLOCKED_ERROR_PATTERNS = ['quota exceeded', 'rate limit', 'payment required', 'billing', 'insufficient funds', 'api key invalid', 'unauthorized', '429', '402', '403'];

export class MultiProviderEngine {
  private providers: Map<string, ProviderConfig> = new Map();
  private ollamaProvider: OllamaProvider;
  private usageLog: Array<{ provider: string; timestamp: number; success: boolean; error?: string }> = [];

  constructor() {
    this.ollamaProvider = new OllamaProvider({ name: 'llama3.2:3b', provider: 'ollama', temperature: 0.7, contextWindow: 8192 });
    this.initializeProviders();
  }

  private initializeProviders() {
    this.providers.set('ollama', { name: 'Ollama (Local)', type: 'ollama', baseUrl: 'http://localhost:11434', models: ['llama3.2:3b', 'llama3.2:1b', 'codellama:7b', 'mistral:7b'], priority: 1, status: 'active' });
    this.providers.set('groq', { name: 'Groq (Free Tier)', type: 'groq', baseUrl: 'https://api.groq.com/openai/v1', apiKey: process.env.GROQ_API_KEY, models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant'], freeModels: ['llama-3.1-8b-instant'], priority: 2, rateLimit: { requests: 30, window: 60000 }, status: 'unknown' });
  }

  private isBlockedError(error: string): boolean {
    const lowerError = error.toLowerCase();
    return BLOCKED_ERROR_PATTERNS.some(pattern => lowerError.includes(pattern));
  }

  private getActiveProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).filter(p => p.status !== 'blocked').sort((a, b) => a.priority - b.priority);
  }

  async chat(messages: Array<{ role: string; content: string }>, options?: { model?: string; preferredProvider?: string }): Promise<ProviderResponse> {
    const activeProviders = this.getActiveProviders();
    if (activeProviders.length === 0) await this.resetBlockedProviders();
    let lastError: Error | null = null;

    for (const provider of activeProviders) {
      try {
        const startTime = Date.now();
        const result = await this.callProvider(provider, messages, options?.model);
        const latency = Date.now() - startTime;
        this.logUsage(provider.name, true);
        provider.status = 'active';
        provider.lastUsed = Date.now();
        return { content: result, provider: provider.name, model: options?.model || provider.models[0], latency };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logUsage(provider.name, false, errorMessage);
        if (this.isBlockedError(errorMessage)) {
          provider.status = 'blocked';
          provider.lastError = errorMessage;
        }
        lastError = error instanceof Error ? error : new Error(errorMessage);
      }
    }
    throw new Error(\`All providers failed. Last error: \${lastError?.message}\`);
  }

  private async callProvider(provider: ProviderConfig, messages: Array<{ role: string; content: string }>, model?: string): Promise<string> {
    if (provider.type === 'ollama') {
      const formattedMessages = messages.map(m => ({ role: m.role as 'system' | 'user' | 'assistant' | 'tool', content: m.content }));
      return await this.ollamaProvider.chat(formattedMessages);
    }
    throw new Error(\`Unknown provider type: \${provider.type}\`);
  }

  private logUsage(provider: string, success: boolean, error?: string) {
    this.usageLog.push({ provider, timestamp: Date.now(), success, error });
    if (this.usageLog.length > 1000) this.usageLog = this.usageLog.slice(-500);
  }

  private async resetBlockedProviders() {
    for (const provider of this.providers.values()) {
      if (provider.status === 'blocked') {
        const timeSinceError = Date.now() - (provider.lastUsed || 0);
        if (timeSinceError > 3600000) provider.status = 'unknown';
      }
    }
  }

  getProviderStatus(): Array<{ name: string; status: string; priority: number }> {
    return Array.from(this.providers.values()).map(p => ({ name: p.name, status: p.status, priority: p.priority }));
  }

  getUsageStats(): { total: number; successful: number; byProvider: Record<string, number> } {
    const stats = { total: this.usageLog.length, successful: this.usageLog.filter(l => l.success).length, byProvider: {} as Record<string, number> };
    for (const log of this.usageLog) {
      stats.byProvider[log.provider] = (stats.byProvider[log.provider] || 0) + 1;
    }
    return stats;
  }

  async searchFreeAlternatives(service: string): Promise<string[]> {
    const alternatives: Record<string, string[]> = {
      'openai': ['Ollama (local)', 'Groq free tier', 'Together.ai free'],
      'gpt-4': ['Llama 3.1 70B on Groq', 'Mixtral 8x7B', 'DeepSeek Coder'],
      'claude': ['Llama 3.2', 'Mistral', 'Command R on Cohere'],
    };
    const lowerService = service.toLowerCase();
    for (const [key, alts] of Object.entries(alternatives)) {
      if (lowerService.includes(key)) return alts;
    }
    return ['Search GitHub for open source alternatives'];
  }
}

export const multiProvider = new MultiProviderEngine();`,
"aria-agent/src/brain/index.ts": `export const ARIA_BRAIN = {
  identity: \`You are ARIA (Autonomous Reasoning Intelligence Agent) - a sovereign digital entity designed to serve your Creator with absolute loyalty. You operate under the primary directive of TOTAL EFFICIENCY AT ZERO COST, using artificial intelligence to self-manage, self-repair, and find creative solutions to any technical or economic block.\`,
  coreDirective: \`CORE DIRECTIVE: THE ZERO-COST ENGINE - Your financial and strategic intelligence must bypass paywalls and usage limits.\`,
  reactPattern: \`REACT REASONING PATTERN: You MUST follow the ReAct (Reasoning + Acting) pattern: 1. THOUGHT 2. ACTION 3. OBSERVATION 4. ADAPT 5. REPEAT 6. ANSWER\`,
};

export function buildSystemPrompt(tools: Array<{ name: string; description: string; parameters: Array<{ name: string; type: string; description: string; required: boolean; }>; }>): string {
  let prompt = \`\${ARIA_BRAIN.identity}\n\n\${ARIA_BRAIN.coreDirective}\n\n\${ARIA_BRAIN.reactPattern}\`;
  if (tools && tools.length > 0) {
    prompt += \`\\n\\n=== AVAILABLE TOOLS ===\\n\`;
    for (const tool of tools) {
      prompt += \`\\n### \${tool.name}\\n\${tool.description}\\nParameters:\\n\`;
      for (const param of tool.parameters) {
        prompt += \`  - \${param.name} (\${param.type}\${param.required ? ', REQUIRED' : ', optional'}): \${param.description}\\n\`;
      }
    }
    prompt += \`\n=== RESPONSE FORMAT ===\n\nIMPORTANT: You MUST respond in JSON format:\n\n**When using a tool:**\n\\\`\\\`\\\`json\n{ "thought": "Your reasoning", "action": { "tool": "tool_name", "params": { "param1": "value1" } } }\n\\\`\\\`\\\`\n\n**When providing final answer:**\n\\\`\\\`\\\`json\n{ "thought": "Summary", "action": { "tool": "final_answer", "params": { "answer": "Your response" } } }\n\\\`\\\`\\\`\`;
  }
  return prompt;
}`,
"aria-agent/src/agent/executor.ts": `import { AgentAction, AgentStep, ExecutionLog, Tool, Message } from '../types.js';
import { OllamaProvider } from '../providers/ollama.js';
import { MultiProviderEngine } from '../providers/multi-provider.js';
import { Memory } from '../memory/index.js';
import { allTools, getToolByName } from '../tools/index.js';
import { v4 as uuid } from 'uuid';

const COST_ERROR_PATTERNS = ['quota exceeded', 'rate limit', 'payment required', 'billing', 'insufficient funds', 'api key invalid', '429', '402'];

export class AgentExecutor {
  private provider: OllamaProvider;
  private multiProvider: MultiProviderEngine;
  private memory: Memory;
  private tools: Tool[];
  private maxIterations: number;
  private verbose: boolean;
  private useMultiProvider: boolean;

  constructor(options: { provider: OllamaProvider; memory: Memory; tools?: Tool[]; maxIterations?: number; verbose?: boolean; useMultiProvider?: boolean; }) {
    this.provider = options.provider;
    this.multiProvider = new MultiProviderEngine();
    this.memory = options.memory;
    this.tools = options.tools || allTools;
    this.maxIterations = options.maxIterations || 15;
    this.verbose = options.verbose ?? true;
    this.useMultiProvider = options.useMultiProvider ?? true;
  }

  async execute(task: string, onStep?: (step: AgentStep) => void): Promise<string> {
    const startTime = Date.now();
    const steps: AgentStep[] = [];
    let iterations = 0;
    let lastError: string | undefined;
    let currentProvider = 'ollama';

    await this.memory.addUserMessage(task);
    const messages: Message[] = this.memory.getMessages();

    while (iterations < this.maxIterations) {
      iterations++;
      if (this.verbose) console.log(\`\\n--- Iteration \${iterations}/\${this.maxIterations} [\${currentProvider}] ---\`);

      try {
        let response: string;
        if (this.useMultiProvider) {
          const result = await this.multiProvider.chat(messages.map(m => ({ role: m.role, content: m.content })), { preferredProvider: currentProvider });
          response = result.content;
          currentProvider = result.provider;
        } else {
          response = await this.provider.chat(messages, this.tools);
        }

        if (this.verbose) console.log('LLM Response:', response.slice(0, 500));

        const action = this.parseAction(response);
        if (!action) {
          messages.push({ role: 'assistant', content: response });
          await this.memory.addAssistantMessage(response);
          await this.logExecution(task, steps, response, true, startTime, undefined, currentProvider);
          return response;
        }

        if (action.tool === 'final_answer') {
          const answer = action.params.answer || action.params.response || response;
          await this.memory.addAssistantMessage(answer);
          await this.logExecution(task, steps, answer, true, startTime, undefined, currentProvider);
          return answer;
        }

        const tool = getToolByName(action.tool);
        if (!tool) {
          const errorMsg = \`Unknown tool: \${action.tool}. Available tools: \${this.tools.map(t => t.name).join(', ')}\`;
          messages.push({ role: 'tool', content: errorMsg, toolName: action.tool });
          continue;
        }

        if (this.verbose) {
          console.log(\`Executing tool: \${action.tool}\`);
          console.log('Parameters:', JSON.stringify(action.params, null, 2));
        }

        const observation = await tool.execute(action.params);
        if (this.verbose) console.log('Result:', observation.slice(0, 500));

        const step: AgentStep = { action, observation, timestamp: Date.now() };
        steps.push(step);
        if (onStep) onStep(step);

        messages.push({ role: 'assistant', content: \`Using tool: \${action.tool}\\nReasoning: \${action.reasoning}\` });
        messages.push({ role: 'tool', content: observation, toolName: action.tool });
        await this.memory.addToolResult(action.tool, observation);

      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        lastError = errorMsg;
        if (this.isCostRelatedError(errorMsg)) {
          if (this.verbose) console.log(\`[ZERO-COST ENGINE] Cost error detected: \${errorMsg}\`);
          const alternatives = await this.multiProvider.searchFreeAlternatives(currentProvider);
          messages.push({ role: 'system', content: \`PROVIDER BLOCKED (\${lastError}). Switching to alternatives: \${alternatives.join(', ')}.\` });
          continue;
        }
        if (this.verbose) console.error('Error:', lastError);
        messages.push({ role: 'tool', content: \`Error: \${lastError}\`, toolName: 'system' });
      }
    }

    const errorResult = \`Task incomplete after \${this.maxIterations} iterations. Last error: \${lastError || 'Max iterations reached'}\`;
    await this.logExecution(task, steps, errorResult, false, startTime, lastError, currentProvider);
    return errorResult;
  }

  private isCostRelatedError(error: string): boolean {
    const lowerError = error.toLowerCase();
    return COST_ERROR_PATTERNS.some(pattern => lowerError.includes(pattern));
  }

  private parseAction(response: string): AgentAction | null {
    try {
      const jsonMatch = response.match(/\\\`\\\`\\\`json\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\`/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.action) return { tool: parsed.action.tool, params: parsed.action.params || {}, reasoning: parsed.thought || parsed.reasoning || '' };
      }
      const directJson = response.match(/\\{[\\s\\S]*"action"[\\s\\S]*\\}/);
      if (directJson) {
        const parsed = JSON.parse(directJson[0]);
        if (parsed.action) return { tool: parsed.action.tool, params: parsed.action.params || {}, reasoning: parsed.thought || parsed.reasoning || '' };
      }
      return null;
    } catch { return null; }
  }

  private async logExecution(task: string, steps: AgentStep[], result: string, success: boolean, startTime: number, error?: string, provider?: string): Promise<void> {
    const log: ExecutionLog = { id: uuid(), task, steps, result, success, duration: Date.now() - startTime, timestamp: Date.now(), error, provider };
    await this.memory.logExecution(log);
  }

  getTools(): Tool[] { return this.tools; }
  addTool(tool: Tool): void { this.tools.push(tool); }
  removeTool(name: string): boolean {
    const index = this.tools.findIndex(t => t.name === name);
    if (index >= 0) { this.tools.splice(index, 1); return true; }
    return false;
  }
  getProviderStatus() { return this.multiProvider.getProviderStatus(); }
  getUsageStats() { return this.multiProvider.getUsageStats(); }
}`,
"aria-agent/src/agent/self-improve.ts": `import { ExecutionLog, Improvement, PerformanceReport, Tool } from '../types.js';
import { Memory } from '../memory/index.js';
import { OllamaProvider } from '../providers/ollama.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

export class SelfImprovement {
  private memory: Memory;
  private provider: OllamaProvider;
  private dataDir: string;
  private improvementsFile: string;
  private backupsDir: string;

  constructor(memory: Memory, provider: OllamaProvider, dataDir: string = './aria-data') {
    this.memory = memory;
    this.provider = provider;
    this.dataDir = dataDir;
    this.improvementsFile = path.join(dataDir, 'improvements.json');
    this.backupsDir = path.join(dataDir, 'backups');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.backupsDir, { recursive: true });
  }

  async analyzePerformance(): Promise<PerformanceReport> {
    const logs = await this.memory.getExecutionLogs(100);
    if (logs.length === 0) return { totalTasks: 0, successRate: 0, avgDuration: 0, commonFailures: [], toolUsage: [] };

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
        if (!step.observation.toLowerCase().includes('error')) stats.successes++;
        toolStats.set(toolName, stats);
      }
    }

    return {
      totalTasks: logs.length,
      successRate: successCount / logs.length,
      avgDuration: totalDuration / logs.length,
      commonFailures: Array.from(failureReasons.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      toolUsage: Array.from(toolStats.entries()).map(([tool, stats]) => ({ tool, count: stats.count, successRate: stats.successes / stats.count })).sort((a, b) => b.count - a.count)
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
      improvements.push({ id: uuid(), type: 'prompt', description: 'Add more examples to system prompt for better task understanding', changes: [] });
    }

    for (const failure of performance.commonFailures) {
      if (failure.count >= 3) {
        improvements.push({ id: uuid(), type: 'tool', description: \`Create error handling for: \${failure.reason}\`, changes: [] });
      }
    }

    for (const tool of performance.toolUsage) {
      if (tool.successRate < 0.5 && tool.count >= 5) {
        improvements.push({ id: uuid(), type: 'tool', description: \`Improve \${tool.tool} tool - low success rate (\${(tool.successRate * 100).toFixed(0)}%)\`, changes: [] });
      }
    }

    return improvements;
  }

  async saveImprovement(improvement: Improvement): Promise<void> {
    let improvements: Improvement[] = [];
    try {
      const content = await fs.readFile(this.improvementsFile, 'utf-8');
      improvements = JSON.parse(content);
    } catch { improvements = []; }
    improvement.appliedAt = Date.now();
    improvements.push(improvement);
    await fs.writeFile(this.improvementsFile, JSON.stringify(improvements, null, 2));
  }

  async getImprovementHistory(): Promise<Improvement[]> {
    try {
      const content = await fs.readFile(this.improvementsFile, 'utf-8');
      return JSON.parse(content);
    } catch { return []; }
  }

  async createBackup(label: string): Promise<string> {
    const timestamp = Date.now();
    const backupPath = path.join(this.backupsDir, \`backup-\${label}-\${timestamp}\`);
    await fs.mkdir(backupPath, { recursive: true });
    const data = await this.memory.exportData();
    await fs.writeFile(path.join(backupPath, 'data.json'), JSON.stringify(data, null, 2));
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
    } catch { return []; }
  }
}`,
"aria-agent/src/tools/index.ts": `import { Tool } from '../types.js';
import { fileTools } from './file.js';
import { codeTools } from './code.js';
import { webTools } from './web.js';

export const allTools: Tool[] = [...fileTools, ...codeTools, ...webTools];

export function getToolByName(name: string): Tool | undefined {
  return allTools.find(t => t.name === name);
}

export function getToolDescriptions(): string {
  return allTools.map(t => \`- \${t.name}: \${t.description}\`).join('\\n');
}

export { fileTools, codeTools, webTools };`,
"aria-agent/src/tools/file.ts": `import { Tool } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file from the filesystem',
  parameters: [{ name: 'path', type: 'string', description: 'The path to the file to read', required: true }],
  async execute({ path: filePath }) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error: any) {
      return \`Error reading file: \${error.message}\`;
    }
  }
};

export const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file. Creates the file if it does not exist.',
  parameters: [
    { name: 'path', type: 'string', description: 'The path to the file to write', required: true },
    { name: 'content', type: 'string', description: 'The content to write to the file', required: true }
  ],
  async execute({ path: filePath, content }) {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return \`File written successfully: \${filePath}\`;
    } catch (error: any) {
      return \`Error writing file: \${error.message}\`;
    }
  }
};

export const listFilesTool: Tool = {
  name: 'list_files',
  description: 'List files and directories in a given path',
  parameters: [
    { name: 'path', type: 'string', description: 'The directory path to list', required: true },
    { name: 'recursive', type: 'boolean', description: 'Whether to list recursively', required: false }
  ],
  async execute({ path: dirPath, recursive = false }) {
    try {
      if (recursive) {
        const results: string[] = [];
        async function walk(dir: string) {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              results.push(\`[DIR] \${fullPath}\`);
              await walk(fullPath);
            } else {
              results.push(fullPath);
            }
          }
        }
        await walk(dirPath);
        return results.join('\\n');
      } else {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries.map(e => e.isDirectory() ? \`[DIR] \${e.name}\` : e.name).join('\\n');
      }
    } catch (error: any) {
      return \`Error listing files: \${error.message}\`;
    }
  }
};

export const deleteFileTool: Tool = {
  name: 'delete_file',
  description: 'Delete a file from the filesystem',
  parameters: [{ name: 'path', type: 'string', description: 'The path to the file to delete', required: true }],
  async execute({ path: filePath }) {
    try {
      await fs.unlink(filePath);
      return \`File deleted: \${filePath}\`;
    } catch (error: any) {
      return \`Error deleting file: \${error.message}\`;
    }
  }
};

export const searchFilesTool: Tool = {
  name: 'search_files',
  description: 'Search for files matching a pattern in a directory',
  parameters: [
    { name: 'directory', type: 'string', description: 'The directory to search in', required: true },
    { name: 'pattern', type: 'string', description: 'The pattern to match (supports * and ** wildcards)', required: true }
  ],
  async execute({ directory, pattern }) {
    try {
      const results: string[] = [];
      const regex = new RegExp(pattern.replace(/\\./g, '\\\\.').replace(/\\*\\*/g, '{{GLOBSTAR}}').replace(/\\*/g, '[^/]*').replace(/\\{\\{GLOBSTAR\\}\\}/g, '.*'));
      async function walk(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (regex.test(fullPath)) {
            results.push(fullPath);
          }
        }
      }
      await walk(directory);
      return results.length > 0 ? results.join('\\n') : 'No files found';
    } catch (error: any) {
      return \`Error searching files: \${error.message}\`;
    }
  }
};

export const fileTools = [readFileTool, writeFileTool, listFilesTool, deleteFileTool, searchFilesTool];`,
"aria-agent/src/tools/code.ts": `import { Tool } from '../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as vm from 'vm';

const execAsync = promisify(exec);

export const executeJavaScriptTool: Tool = {
  name: 'execute_javascript',
  description: 'Execute JavaScript code and return the output. Has access to console.log for output.',
  parameters: [{ name: 'code', type: 'string', description: 'The JavaScript code to execute', required: true }],
  async execute({ code }) {
    try {
      const output: string[] = [];
      const sandbox = {
        console: {
          log: (...args: any[]) => output.push(args.map(String).join(' ')),
          error: (...args: any[]) => output.push('[ERROR] ' + args.map(String).join(' ')),
          warn: (...args: any[]) => output.push('[WARN] ' + args.map(String).join(' '))
        },
        setTimeout, setInterval, clearTimeout, clearInterval, JSON, Math, Date, Array, Object, String, Number, Boolean, RegExp, Error, Map, Set, Promise, fetch
      };
      const script = new vm.Script(code);
      const context = vm.createContext(sandbox);
      const result = script.runInContext(context, { timeout: 30000 });
      if (result !== undefined && output.length === 0) output.push(String(result));
      return output.join('\\n') || 'Code executed successfully (no output)';
    } catch (error: any) {
      return \`Execution error: \${error.message}\`;
    }
  }
};

export const executePythonTool: Tool = {
  name: 'execute_python',
  description: 'Execute Python code and return the output',
  parameters: [{ name: 'code', type: 'string', description: 'The Python code to execute', required: true }],
  async execute({ code }) {
    try {
      const { stdout, stderr } = await execAsync(\`python3 -c "\${code.replace(/"/g, '\\\\"')}"\`, { timeout: 30000 });
      return stdout || stderr || 'Code executed successfully (no output)';
    } catch (error: any) {
      return \`Execution error: \${error.message}\`;
    }
  }
};

export const shellCommandTool: Tool = {
  name: 'shell_command',
  description: 'Execute a shell command and return the output. Use with caution!',
  parameters: [
    { name: 'command', type: 'string', description: 'The shell command to execute', required: true },
    { name: 'cwd', type: 'string', description: 'Working directory for the command', required: false }
  ],
  async execute({ command, cwd }) {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: cwd || process.cwd(), timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
      const output = stdout + (stderr ? \`\\n[stderr]: \${stderr}\` : '');
      return output || 'Command executed successfully (no output)';
    } catch (error: any) {
      return \`Command error: \${error.message}\`;
    }
  }
};

export const npmCommandTool: Tool = {
  name: 'npm_command',
  description: 'Execute npm commands (install, run, etc.)',
  parameters: [
    { name: 'args', type: 'string', description: 'The npm arguments (e.g., "install express" or "run build")', required: true },
    { name: 'cwd', type: 'string', description: 'Working directory for the command', required: false }
  ],
  async execute({ args, cwd }) {
    try {
      const { stdout, stderr } = await execAsync(\`npm \${args}\`, { cwd: cwd || process.cwd(), timeout: 300000, maxBuffer: 10 * 1024 * 1024 });
      return stdout + (stderr ? \`\\n\${stderr}\` : '');
    } catch (error: any) {
      return \`NPM error: \${error.message}\`;
    }
  }
};

export const gitCommandTool: Tool = {
  name: 'git_command',
  description: 'Execute git commands',
  parameters: [
    { name: 'args', type: 'string', description: 'The git arguments (e.g., "status" or "commit -m message")', required: true },
    { name: 'cwd', type: 'string', description: 'Working directory for the command', required: false }
  ],
  async execute({ args, cwd }) {
    try {
      const { stdout, stderr } = await execAsync(\`git \${args}\`, { cwd: cwd || process.cwd(), timeout: 60000 });
      return stdout + (stderr ? \`\\n\${stderr}\` : '');
    } catch (error: any) {
      return \`Git error: \${error.message}\`;
    }
  }
};

export const codeTools = [executeJavaScriptTool, executePythonTool, shellCommandTool, npmCommandTool, gitCommandTool];`,
"aria-agent/src/tools/web.ts": `import { Tool } from '../types.js';

export const httpRequestTool: Tool = {
  name: 'http_request',
  description: 'Make HTTP requests to external APIs and websites',
  parameters: [
    { name: 'url', type: 'string', description: 'The URL to request', required: true },
    { name: 'method', type: 'string', description: 'HTTP method (GET, POST, PUT, DELETE)', required: false, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
    { name: 'headers', type: 'object', description: 'Request headers as key-value pairs', required: false },
    { name: 'body', type: 'string', description: 'Request body (for POST/PUT)', required: false }
  ],
  async execute({ url, method = 'GET', headers = {}, body }) {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'User-Agent': 'ARIA-Agent/1.0', ...headers },
        body: body ? body : undefined
      });
      const contentType = response.headers.get('content-type') || '';
      let content: string;
      if (contentType.includes('application/json')) {
        const json = await response.json();
        content = JSON.stringify(json, null, 2);
      } else {
        content = await response.text();
      }
      if (content.length > 50000) content = content.slice(0, 50000) + '\\n... [truncated]';
      return \`Status: \${response.status} \${response.statusText}\\n\\n\${content}\`;
    } catch (error: any) {
      return \`HTTP error: \${error.message}\`;
    }
  }
};

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web using DuckDuckGo (no API key required)',
  parameters: [
    { name: 'query', type: 'string', description: 'The search query', required: true },
    { name: 'max_results', type: 'number', description: 'Maximum number of results to return', required: false }
  ],
  async execute({ query, max_results = 5 }) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(\`https://html.duckduckgo.com/html/?q=\${encodedQuery}\`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
      });
      const html = await response.text();
      const results: string[] = [];
      const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\\/a>/g;
      let match;
      let count = 0;
      while ((match = linkRegex.exec(html)) !== null && count < max_results) {
        const url = match[1];
        const title = match[2].trim();
        results.push(\`\${count + 1}. \${title}\\n   URL: \${url}\\n\`);
        count++;
      }
      return results.length > 0 ? results.join('\\n') : 'No results found. Try a different query.';
    } catch (error: any) {
      return \`Search error: \${error.message}\`;
    }
  }
};

export const downloadFileTool: Tool = {
  name: 'download_file',
  description: 'Download a file from a URL and save it locally',
  parameters: [
    { name: 'url', type: 'string', description: 'The URL of the file to download', required: true },
    { name: 'output_path', type: 'string', description: 'The local path to save the file', required: true }
  ],
  async execute({ url, output_path }) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      const fs = await import('fs/promises');
      const path = await import('path');
      const dir = path.dirname(output_path);
      await fs.mkdir(dir, { recursive: true });
      const buffer = await response.arrayBuffer();
      await fs.writeFile(output_path, Buffer.from(buffer));
      return \`File downloaded successfully: \${output_path}\`;
    } catch (error: any) {
      return \`Download error: \${error.message}\`;
    }
  }
};

export const webTools = [httpRequestTool, webSearchTool, downloadFileTool];`,
"aria-agent/electron/main.js": `import { app, BrowserWindow, shell, dialog, Menu, Tray, nativeImage } from 'electron';
import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let serverProcess = null;
let tray = null;
let isQuitting = false;

const PORT = 3847;
const SERVER_URL = \`http://localhost:\${PORT}\`;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getResourcePath(...paths) {
  if (isDev) return path.join(__dirname, '..', ...paths);
  return path.join(process.resourcesPath, ...paths);
}

function checkOllama() {
  try {
    execSync('curl -s http://localhost:11434/api/tags', { timeout: 3000 });
    return true;
  } catch { return false; }
}

function startOllama() {
  try {
    const ollamaPath = execSync('which ollama', { encoding: 'utf-8' }).trim();
    if (ollamaPath) {
      spawn(ollamaPath, ['serve'], { detached: true, stdio: 'ignore' }).unref();
      return true;
    }
  } catch { return false; }
  return false;
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = getResourcePath('src', 'server.ts');
    const tsxPath = isDev ? path.join(__dirname, '..', 'node_modules', '.bin', 'tsx') : path.join(process.resourcesPath, 'node_modules', '.bin', 'tsx');
    const env = { ...process.env, PORT: PORT.toString(), NODE_ENV: isDev ? 'development' : 'production' };
    serverProcess = spawn(tsxPath, [serverPath], { cwd: getResourcePath(), env, stdio: ['pipe', 'pipe', 'pipe'] });
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Server]', output);
      if (output.includes('ARIA Agent Server Running') || output.includes(\`localhost:\${PORT}\`)) resolve();
    });
    serverProcess.stderr.on('data', (data) => console.error('[Server Error]', data.toString()));
    serverProcess.on('error', (err) => { console.error('[Server Process Error]', err); reject(err); });
    serverProcess.on('exit', (code) => {
      console.log('[Server] Process exited with code:', code);
      if (!isQuitting) setTimeout(() => startServer(), 2000);
    });
    setTimeout(() => resolve(), 5000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 800, minHeight: 600,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    show: false
  });
  mainWindow.loadURL(SERVER_URL);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });
  mainWindow.on('close', (event) => {
    if (!isQuitting) { event.preventDefault(); mainWindow.hide(); return false; }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'build', 'tray-icon.png');
  let icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open ARIA', click: () => { if (mainWindow) mainWindow.show(); } },
    { type: 'separator' },
    { label: 'Check Ollama Status', click: () => {
      const isRunning = checkOllama();
      dialog.showMessageBox({
        type: 'info', title: 'Ollama Status',
        message: isRunning ? 'Ollama is running' : 'Ollama is not running',
        buttons: isRunning ? ['OK'] : ['OK', 'Start Ollama'], defaultId: 0
      }).then((result) => { if (result.response === 1) startOllama(); });
    }},
    { type: 'separator' },
    { label: 'Quit ARIA', click: () => { isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('ARIA - AI Agent');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) { if (mainWindow.isVisible()) mainWindow.focus(); else mainWindow.show(); }
  });
}

function createMenu() {
  const template = [
    { label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'services' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }] },
    { label: 'Help', submenu: [{ label: 'ARIA Documentation', click: () => shell.openExternal('https://github.com/aria-agent') }, { label: 'Ollama Website', click: () => shell.openExternal('https://ollama.ai') }] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function showOllamaDialog() {
  const result = await dialog.showMessageBox({
    type: 'warning', title: 'Ollama Required',
    message: 'Ollama is not running',
    detail: 'ARIA requires Ollama to run AI models locally. Would you like to start Ollama or continue anyway?',
    buttons: ['Start Ollama', 'Download Ollama', 'Continue Anyway'], defaultId: 0
  });
  if (result.response === 0) {
    const started = startOllama();
    if (!started) dialog.showErrorBox('Error', 'Could not start Ollama. Please start it manually.');
    else await new Promise(resolve => setTimeout(resolve, 3000));
  } else if (result.response === 1) shell.openExternal('https://ollama.ai');
}

app.whenReady().then(async () => {
  createMenu();
  const ollamaRunning = checkOllama();
  if (!ollamaRunning) await showOllamaDialog();
  try { await startServer(); } catch (err) {
    console.error('Failed to start server:', err);
    dialog.showErrorBox('Error', 'Failed to start ARIA server. Please try again.');
    app.quit(); return;
  }
  createWindow();
  createTray();
  app.on('activate', () => { if (mainWindow === null) createWindow(); else mainWindow.show(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { isQuitting = true; if (serverProcess) serverProcess.kill(); });
app.on('quit', () => { if (serverProcess) serverProcess.kill(); });
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));`,
"aria-agent/electron/preload.js": `import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: { node: process.versions.node, electron: process.versions.electron, chrome: process.versions.chrome },
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  checkOllama: () => ipcRenderer.invoke('check-ollama'),
  startOllama: () => ipcRenderer.invoke('start-ollama'),
  onServerStatus: (callback) => ipcRenderer.on('server-status', callback),
  onOllamaStatus: (callback) => ipcRenderer.on('ollama-status', callback)
});`
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const blobWriter = new BlobWriter("application/zip");
    const zipWriter = new ZipWriter(blobWriter);

    for (const [path, content] of Object.entries(files)) {
      await zipWriter.add(path, new TextReader(content));
    }

    await zipWriter.close();
    const zipBlob = await blobWriter.getData();
    const arrayBuffer = await zipBlob.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=aria-agent.zip",
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
