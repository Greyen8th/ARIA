import { AgentAction, AgentStep, ExecutionLog, Tool, Message, AIProvider } from '../types.js';
import { MultiProviderEngine } from '../providers/multi-provider.js';
import { Memory } from '../memory/index.js';
import { getAllTools, getToolByName } from '../tools/index.js';
import { v4 as uuid } from 'uuid';
import { PromptManager } from './prompt-manager.js';
import { logPromptUsage, getSessionId, hashPrompt } from '../brain/prompt-logger.js';
import * as path from 'path';

const COST_ERROR_PATTERNS = [
  'quota exceeded',
  'rate limit',
  'payment required',
  'billing',
  'insufficient funds',
  'api key invalid',
  '429',
  '402',
];

export class AgentExecutor {
  private provider: AIProvider;
  private multiProvider: MultiProviderEngine;
  private memory: Memory;
  private tools: Tool[];
  private maxIterations: number;
  private verbose: boolean;
  private useMultiProvider: boolean;
  private promptManager: PromptManager;
  private isStopped: boolean = false;
  private currentLanguage: 'en' | 'it' = 'en';

  constructor(options: {
    provider: AIProvider;
    memory: Memory;
    tools?: Tool[];
    maxIterations?: number;
    verbose?: boolean;
    useMultiProvider?: boolean;
    projectRoot?: string;
  }) {
    this.provider = options.provider;
    this.multiProvider = new MultiProviderEngine();
    this.memory = options.memory;
    this.tools = options.tools || getAllTools();
    this.maxIterations = options.maxIterations || 15;
    this.verbose = options.verbose ?? true;
    this.useMultiProvider = options.useMultiProvider ?? true;
    
    // Initialize prompt manager
    const root = options.projectRoot || path.resolve('./');
    this.promptManager = new PromptManager(root);
    this.promptManager.initialize().catch(err => console.error('PromptManager init failed:', err));
  }

  setLanguage(lang: 'en' | 'it') {
    this.currentLanguage = lang;
    this.promptManager.setLanguage(lang);
  }

  stop(): void {
    this.isStopped = true;
    console.log('[EXECUTOR] KILL SWITCH ACTIVATED - Stopping execution');
  }

  resume(): void {
    this.isStopped = false;
    console.log('[EXECUTOR] Execution resumed');
  }

  isRunning(): boolean {
    return !this.isStopped;
  }

  async execute(task: string, onStep?: (step: AgentStep) => void): Promise<string> {
    this.isStopped = false;
    const startTime = Date.now();
    const steps: AgentStep[] = [];
    let iterations = 0;
    let lastError: string | undefined;
    let currentProvider = 'ollama';
    let jsonRetryCount = 0;
    const MAX_JSON_RETRIES = 2;

    let systemPrompt = this.promptManager.getSystemPrompt();

    const promptLog = logPromptUsage(
      systemPrompt,
      'executor',
      this.currentLanguage,
      this.tools.length
    );

    if (this.verbose) {
      console.log(`[PROMPT-COMPLIANCE] Session: ${getSessionId()}`);
      console.log(`[PROMPT-COMPLIANCE] Hash: ${promptLog.promptHash}`);
      console.log(`[PROMPT-COMPLIANCE] Length: ${promptLog.promptLength} chars`);
    }

    // Context Injection: Recall relevant long-term memories
    try {
      const relevantMemories = await this.memory.searchLongTermMemory(task, 3);
      if (relevantMemories.length > 0) {
        systemPrompt += `\n\n=== RELEVANT PAST MEMORIES ===\n${relevantMemories.map(m => `- ${m}`).join('\n')}\n==============================\n`;
        if (this.verbose) {
          console.log('[Memory] Injected relevant past experiences into context.');
        }
      }
    } catch (err) {
      console.warn('[Memory] Failed to recall long-term memory:', err);
    }

    await this.memory.addUserMessage(task);

    const messages: Message[] = this.memory.getMessages();

    while (iterations < this.maxIterations) {
      if (this.isStopped) {
        const stopMsg = 'Execution stopped by user (Kill Switch activated)';
        await this.logExecution(task, steps, stopMsg, false, startTime, 'USER_STOPPED', currentProvider);
        return stopMsg;
      }

      iterations++;

      if (this.verbose) {
        console.log(`\n--- Iteration ${iterations}/${this.maxIterations} [${currentProvider}] ---`);
      }

      try {
        let response: string;

        if (this.useMultiProvider) {
          const messagesWithPrompt = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content }))
          ];

          try {
            const result = await this.multiProvider.chat(
              messagesWithPrompt,
              { preferredProvider: currentProvider }
            );
            response = result.content;
            currentProvider = result.provider;

            if (this.verbose) {
              console.log(`Provider used: ${result.provider} (${result.latency}ms)`);
            }
          } catch (err: any) {
            if (err.message.includes('All providers failed')) {
              const errorMsg = "CRITICAL: No AI provider is available.";
              await this.logExecution(task, steps, errorMsg, false, startTime, err.message, 'none');
              return errorMsg;
            }
            throw err;
          }
        } else {
          const ollamaResult = await this.provider.chat(messages, this.tools, systemPrompt);
          response = ollamaResult;
        }

        if (this.verbose) {
          console.log('LLM Response:', response.slice(0, 500));
        }

        let action = this.parseAction(response);

        if (!action && jsonRetryCount < MAX_JSON_RETRIES) {
          jsonRetryCount++;
          if (this.verbose) {
            console.log(`[STRUCTURED-OUTPUT] JSON parse failed, retry ${jsonRetryCount}/${MAX_JSON_RETRIES}`);
          }
          messages.push({
            role: 'system',
            content: 'ERROR: Your response was not valid JSON. You MUST respond with valid JSON format as specified. Use ```json ... ``` blocks.'
          });
          continue;
        }

        if (!action) {
          messages.push({ role: 'assistant', content: response });
          await this.memory.addAssistantMessage(response);

          await this.logExecution(task, steps, response, true, startTime, undefined, currentProvider);
          return response;
        }

        jsonRetryCount = 0;

        if (action.tool === 'final_answer') {
          const answer = action.params.answer || action.params.response || response;
          await this.memory.addAssistantMessage(answer);

          await this.logExecution(task, steps, answer, true, startTime, undefined, currentProvider);
          return answer;
        }

        if (action.tool === 'search_free_alternatives') {
          const service = action.params.service || action.params.query;
          const alternatives = await this.multiProvider.searchFreeAlternatives(service);
          const observation = `Free alternatives for "${service}":\n${alternatives.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;

          const step: AgentStep = {
            action,
            observation,
            timestamp: Date.now()
          };
          steps.push(step);
          if (onStep) onStep(step);

          messages.push({
            role: 'assistant',
            content: `Searching free alternatives for: ${service}`
          });
          messages.push({
            role: 'tool',
            content: observation,
            toolName: action.tool
          });
          continue;
        }

        const tool = getToolByName(action.tool);
        if (!tool) {
          const observation = `Unknown tool: ${action.tool}. Available tools: ${this.tools.map(t => t.name).join(', ')}`;
           messages.push({
            role: 'tool',
            content: observation,
            toolName: action.tool
          });
          continue;
        }

        const toolCallLog = {
          timestamp: Date.now(),
          sessionId: getSessionId(),
          tool: action.tool,
          params: action.params,
          reasoning: action.reasoning
        };

        console.log(`[TOOL-CALL] ${JSON.stringify(toolCallLog)}`);

        if (this.verbose) {
          console.log(`Executing tool: ${action.tool}`);
          console.log('Parameters:', JSON.stringify(action.params, null, 2));
        }

        const observation = await tool.execute(action.params);

        console.log(`[TOOL-RESULT] tool=${action.tool} | len=${observation.length} | preview=${observation.slice(0, 100).replace(/\n/g, ' ')}`);

        if (this.verbose) {
          console.log('Result:', observation.slice(0, 500));
        }

        const step: AgentStep = {
          action,
          observation,
          timestamp: Date.now()
        };
        steps.push(step);

        if (onStep) {
          onStep(step);
        }

        messages.push({
          role: 'assistant',
          content: `Using tool: ${action.tool}\nReasoning: ${action.reasoning}`
        });
        messages.push({
          role: 'tool',
          content: observation,
          toolName: action.tool
        });

        await this.memory.addToolResult(action.tool, observation);

      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        lastError = errorMsg;

        if (this.isCostRelatedError(errorMsg)) {
          if (this.verbose) {
            console.log(`[ZERO-COST ENGINE] Cost error detected: ${errorMsg}`);
            console.log('[ZERO-COST ENGINE] Switching to alternative provider...');
          }

          const alternatives = await this.multiProvider.searchFreeAlternatives(currentProvider);
          messages.push({
            role: 'system',
            content: `PROVIDER BLOCKED (${lastError}). Switching to alternatives: ${alternatives.join(', ')}. Continue with the task.`
          });
          continue;
        }

        if (this.verbose) {
          console.error('Error:', lastError);
        }
        messages.push({
          role: 'tool',
          content: `Error: ${lastError}`,
          toolName: 'system'
        });
      }
    }

    const errorResult = `Task incomplete after ${this.maxIterations} iterations. Last error: ${lastError || 'Max iterations reached'}`;
    await this.logExecution(task, steps, errorResult, false, startTime, lastError, currentProvider);
    return errorResult;
  }

  private isCostRelatedError(error: string): boolean {
    const lowerError = error.toLowerCase();
    return COST_ERROR_PATTERNS.some(pattern => lowerError.includes(pattern));
  }

  private parseAction(response: string): AgentAction | null {
    try {
      // 1. STANDARD JSON PARSING
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.action) {
          return {
            tool: parsed.action.tool,
            params: parsed.action.params || {},
            reasoning: parsed.thought || parsed.reasoning || ''
          };
        }
      }

      // 2. DIRECT JSON PARSING
      const directJson = response.match(/\{[\s\S]*"action"[\s\S]*\}/);
      if (directJson) {
        const parsed = JSON.parse(directJson[0]);
        if (parsed.action) {
          return {
            tool: parsed.action.tool,
            params: parsed.action.params || {},
            reasoning: parsed.thought || parsed.reasoning || ''
          };
        }
      }

      // 3. ROBUST COMMAND PARSING (For Local Models)
      // Supports: [CMD: SCREENSHOT] or [CMD: EXECUTE "ls -la"]
      const cmdMatch = response.match(/\[CMD:\s*([A-Z_]+)(?:\s+(.*))?\]/);
      if (cmdMatch) {
        const command = cmdMatch[1];
        const args = cmdMatch[2] ? cmdMatch[2].replace(/^"|"$/g, '') : '';
        
        // Map simplified commands to actual tools
        switch (command) {
            case 'SCREENSHOT':
                return {
                    tool: 'desktop_vision_capture',
                    params: {},
                    reasoning: 'User requested visual analysis or screenshot.'
                };
            case 'EXECUTE':
                return {
                    tool: 'run_terminal_command',
                    params: { command: args },
                    reasoning: 'Executing terminal command requested by model.'
                };
            case 'READ_FILE':
                return {
                    tool: 'read_file',
                    params: { path: args },
                    reasoning: 'Reading file content.'
                };
            case 'WRITE_FILE':
                // Expects args like: "path/to/file" "content"
                // This is tricky with regex, simpler to use JSON for write.
                // But let's try basic split if quotes exist
                return null; // Force JSON for complex ops
            default:
                return null;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private async logExecution(
    task: string,
    steps: AgentStep[],
    result: string,
    success: boolean,
    startTime: number,
    error?: string,
    provider?: string
  ): Promise<void> {
    const log: ExecutionLog = {
      id: uuid(),
      task,
      steps,
      result,
      success,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
      error,
      provider
    };
    await this.memory.logExecution(log);
  }

  getTools(): Tool[] {
    return this.tools;
  }

  addTool(tool: Tool): void {
    this.tools.push(tool);
  }

  removeTool(name: string): boolean {
    const index = this.tools.findIndex(t => t.name === name);
    if (index >= 0) {
      this.tools.splice(index, 1);
      return true;
    }
    return false;
  }

  getProviderStatus() {
    return this.multiProvider.getProviderStatus();
  }

  getUsageStats() {
    return this.multiProvider.getUsageStats();
  }
}
