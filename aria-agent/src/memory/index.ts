import { Message, ExecutionLog } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { VectorStore } from './vector-store.js';
import { LocalCortex } from '../providers/local-cortex.js';

export class Memory {
  private messages: Message[] = [];
  private maxMessages: number;
  private dataDir: string;
  private conversationFile: string;
  private logsFile: string;
  public vectorStore: VectorStore;

  constructor(dataDir: string = './aria-data', maxMessages: number = 50) {
    this.dataDir = dataDir;
    this.maxMessages = maxMessages;
    this.conversationFile = path.join(dataDir, 'conversation.json');
    this.logsFile = path.join(dataDir, 'execution-logs.json');
    this.vectorStore = new VectorStore(dataDir);
  }

  // Inject Provider into VectorStore
  setProvider(provider: LocalCortex) {
      this.vectorStore.setProvider(provider);
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await this.loadConversation();
    await this.vectorStore.initialize();
  }

  // ... (Rest of the class)

  async addLongTermMemory(text: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.vectorStore.addMemory(text, metadata);
  }

  async searchLongTermMemory(query: string, limit: number = 3): Promise<string[]> {
    const results = await this.vectorStore.search(query, limit);
    return results.map(r => r.text);
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
    await fs.writeFile(
      this.conversationFile,
      JSON.stringify({ messages: this.messages, updatedAt: Date.now() }, null, 2)
    );
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
    await this.addMessage({
      role: 'tool',
      content: result,
      toolName
    });
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  async getTimeline(startTs: number, endTs: number): Promise<any[]> {
    // 1. Get logs in range
    const logs = await this.getExecutionLogs(1000); // Get ample logs
    const relevantLogs = logs.filter(l => l.timestamp >= startTs && l.timestamp <= endTs);

    // 2. Get vector memories in range (if vector store supports temporal query, or we scan all)
    // Vectra doesn't support easy metadata range query efficiently without scanning.
    // For now, we rely on logs + conversation as the timeline source.
    
    // 3. Format timeline
    const timeline = relevantLogs.map(log => ({
      type: 'task',
      timestamp: log.timestamp,
      summary: `Task: ${log.task} (${log.success ? 'Success' : 'Failed'})`,
      details: log.result
    }));

    return timeline.sort((a, b) => a.timestamp - b.timestamp);
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
    } catch {
      logs = [];
    }

    logs.push(log);

    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }

    await fs.writeFile(this.logsFile, JSON.stringify(logs, null, 2));
  }

  async getExecutionLogs(limit?: number): Promise<ExecutionLog[]> {
    try {
      const content = await fs.readFile(this.logsFile, 'utf-8');
      const logs: ExecutionLog[] = JSON.parse(content);
      return limit ? logs.slice(-limit) : logs;
    } catch {
      return [];
    }
  }

  async getSuccessRate(): Promise<number> {
    const logs = await this.getExecutionLogs(100);
    if (logs.length === 0) return 0;
    const successful = logs.filter(l => l.success).length;
    return successful / logs.length;
  }

  async exportData(): Promise<{ conversation: Message[]; logs: ExecutionLog[] }> {
    const logs = await this.getExecutionLogs();
    return {
      conversation: this.messages,
      logs
    };
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
}
