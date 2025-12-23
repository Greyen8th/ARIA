export interface Message {
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

export interface AIProvider {
  chat(messages: Message[], tools?: Tool[], systemPrompt?: string): Promise<string>;
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
}
