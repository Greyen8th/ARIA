// import { OllamaProvider } from './ollama.js';
import { HuggingFaceProvider } from './huggingface.js';

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

const BLOCKED_ERROR_PATTERNS = [
  'quota exceeded',
  'rate limit',
  'payment required',
  'billing',
  'insufficient funds',
  'api key invalid',
  'unauthorized',
  '429',
  '402',
  '403',
];

export class MultiProviderEngine {
  private providers: Map<string, ProviderConfig> = new Map();
  // private ollamaProvider: OllamaProvider;
  private hfFallback: HuggingFaceProvider;
  private usageLog: Array<{ provider: string; timestamp: number; success: boolean; error?: string }> = [];

  constructor() {
    /*
    this.ollamaProvider = new OllamaProvider({
      name: 'llama3.2:3b',
      provider: 'ollama',
      temperature: 0.7,
      contextWindow: 8192
    });
    */
    this.hfFallback = new HuggingFaceProvider();
    this.initializeProviders();
  }

  private initializeProviders() {
    /*
    this.providers.set('ollama', {
      name: 'Ollama (Local)',
      type: 'ollama',
      baseUrl: 'http://localhost:11434',
      models: ['llama3.2:3b', 'llama3.2:1b', 'codellama:7b', 'mistral:7b', 'deepseek-coder:6.7b'],
      priority: 1,
      status: 'active',
    });
    */

    this.providers.set('groq', {
      name: 'Groq (Free Tier)',
      type: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
      models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      freeModels: ['llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      priority: 2,
      rateLimit: { requests: 30, window: 60000 },
      status: 'unknown',
    });

    this.providers.set('together', {
      name: 'Together.ai (Free Tier)',
      type: 'together',
      baseUrl: 'https://api.together.xyz/v1',
      apiKey: process.env.TOGETHER_API_KEY,
      models: ['meta-llama/Llama-3-8b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
      freeModels: ['meta-llama/Llama-3-8b-chat-hf'],
      priority: 3,
      status: 'unknown',
    });

    this.providers.set('huggingface', {
      name: 'HuggingFace Inference',
      type: 'huggingface',
      baseUrl: 'https://api-inference.huggingface.co',
      apiKey: process.env.HF_API_KEY,
      models: ['meta-llama/Llama-3.2-3B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3'],
      priority: 4,
      status: 'unknown',
    });

    this.providers.set('openrouter', {
      name: 'OpenRouter (Free Models)',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      models: ['meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-2-9b-it:free'],
      freeModels: ['meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-2-9b-it:free'],
      priority: 5,
      status: 'unknown',
    });
  }

  private isBlockedError(error: string): boolean {
    const lowerError = error.toLowerCase();
    return BLOCKED_ERROR_PATTERNS.some(pattern => lowerError.includes(pattern));
  }

  private getActiveProviders(): ProviderConfig[] {
    return Array.from(this.providers.values())
      .filter(p => p.status !== 'blocked')
      .sort((a, b) => a.priority - b.priority);
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: { model?: string; preferredProvider?: string }
  ): Promise<ProviderResponse> {
    const activeProviders = this.getActiveProviders();

    if (activeProviders.length === 0) {
      await this.resetBlockedProviders();
    }

    const startProvider = options?.preferredProvider
      ? activeProviders.find(p => p.name.toLowerCase().includes(options.preferredProvider!.toLowerCase()))
      : undefined;

    const orderedProviders = startProvider
      ? [startProvider, ...activeProviders.filter(p => p.name !== startProvider.name)]
      : activeProviders;

    let lastError: Error | null = null;

    for (const provider of orderedProviders) {
      try {
        const startTime = Date.now();
        const result = await this.callProvider(provider, messages, options?.model);
        const latency = Date.now() - startTime;

        this.logUsage(provider.name, true);
        provider.status = 'active';
        provider.lastUsed = Date.now();

        return {
          content: result,
          provider: provider.name,
          model: options?.model || provider.models[0],
          latency,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logUsage(provider.name, false, errorMessage);

        if (this.isBlockedError(errorMessage)) {
          provider.status = 'blocked';
          provider.lastError = errorMessage;
          console.log(`[MultiProvider] ${provider.name} blocked: ${errorMessage}`);
        } else if (errorMessage.includes('rate') || errorMessage.includes('429')) {
          provider.status = 'rate_limited';
          setTimeout(() => {
            provider.status = 'active';
          }, 60000);
        }

        lastError = error instanceof Error ? error : new Error(errorMessage);
      }
    }

    // --- EMERGENCY SURVIVAL MODE ---
    console.warn('[MultiProvider] All standard providers failed. Activating SURVIVAL MODE (HF Fallback).');
    try {
        const hfMessages = messages.map(m => ({
            role: m.role as 'system' | 'user' | 'assistant' | 'tool',
            content: m.content
        }));
        const hfResult = await this.hfFallback.chat(hfMessages);
        return {
            content: hfResult,
            provider: 'emergency-huggingface',
            model: 'mistral-7b-instruct',
            latency: 0
        };
    } catch (emergencyError: any) {
        console.error('[MultiProvider] EMERGENCY BRAIN FAILED:', emergencyError);
        throw new Error(`SYSTEM CRITICAL: All AI providers (including emergency backup) failed. Last error: ${lastError?.message}`);
    }
  }

  private async callProvider(
    provider: ProviderConfig,
    messages: Array<{ role: string; content: string }>,
    model?: string
  ): Promise<string> {
    switch (provider.type) {
      case 'ollama':
        return this.callOllama(messages, model);
      case 'groq':
        return this.callGroq(provider, messages, model);
      case 'together':
        return this.callTogether(provider, messages, model);
      case 'huggingface':
        return this.callHuggingFace(provider, messages, model);
      case 'openrouter':
        return this.callOpenRouter(provider, messages, model);
      default:
        throw new Error(`Unknown provider type: ${provider.type}`);
    }
  }

  private async callOllama(
    messages: Array<{ role: string; content: string }>,
    model?: string
  ): Promise<string> {
    throw new Error("Ollama provider is disabled in this version. Use LocalCortex.");
    /*
    const formattedMessages = messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant' | 'tool',
      content: m.content
    }));

    if (model && model !== this.ollamaProvider['config'].name) {
      this.ollamaProvider = new OllamaProvider({
        name: model,
        provider: 'ollama',
        temperature: 0.7,
        contextWindow: 8192
      });
    }

    return await this.ollamaProvider.chat(formattedMessages);
    */
  }

  private async callGroq(
    provider: ProviderConfig,
    messages: Array<{ role: string; content: string }>,
    model?: string
  ): Promise<string> {
    if (!provider.apiKey) throw new Error('Groq API key not configured');

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || provider.freeModels?.[0] || provider.models[0],
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callTogether(
    provider: ProviderConfig,
    messages: Array<{ role: string; content: string }>,
    model?: string
  ): Promise<string> {
    if (!provider.apiKey) throw new Error('Together API key not configured');

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || provider.freeModels?.[0] || provider.models[0],
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Together error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callHuggingFace(
    provider: ProviderConfig,
    messages: Array<{ role: string; content: string }>,
    model?: string
  ): Promise<string> {
    if (!provider.apiKey) throw new Error('HuggingFace API key not configured');

    const modelId = model || provider.models[0];
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const response = await fetch(`${provider.baseUrl}/models/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0].generated_text : data.generated_text;
  }

  private async callOpenRouter(
    provider: ProviderConfig,
    messages: Array<{ role: string; content: string }>,
    model?: string
  ): Promise<string> {
    if (!provider.apiKey) throw new Error('OpenRouter API key not configured');

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || provider.freeModels?.[0] || provider.models[0],
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private logUsage(provider: string, success: boolean, error?: string) {
    this.usageLog.push({
      provider,
      timestamp: Date.now(),
      success,
      error,
    });

    if (this.usageLog.length > 1000) {
      this.usageLog = this.usageLog.slice(-500);
    }
  }

  private async resetBlockedProviders() {
    for (const provider of this.providers.values()) {
      if (provider.status === 'blocked') {
        const timeSinceError = Date.now() - (provider.lastUsed || 0);
        if (timeSinceError > 3600000) {
          provider.status = 'unknown';
        }
      }
    }
  }

  getProviderStatus(): Array<{ name: string; status: string; priority: number }> {
    return Array.from(this.providers.values()).map(p => ({
      name: p.name,
      status: p.status,
      priority: p.priority,
    }));
  }

  getUsageStats(): { total: number; successful: number; byProvider: Record<string, number> } {
    const stats = {
      total: this.usageLog.length,
      successful: this.usageLog.filter(l => l.success).length,
      byProvider: {} as Record<string, number>,
    };

    for (const log of this.usageLog) {
      stats.byProvider[log.provider] = (stats.byProvider[log.provider] || 0) + 1;
    }

    return stats;
  }

  async searchFreeAlternatives(service: string): Promise<string[]> {
    const alternatives: Record<string, string[]> = {
      'openai': ['Ollama (local)', 'Groq free tier', 'Together.ai free', 'HuggingFace Inference'],
      'gpt-4': ['Llama 3.1 70B on Groq', 'Mixtral 8x7B', 'DeepSeek Coder'],
      'claude': ['Llama 3.2', 'Mistral', 'Command R on Cohere'],
      'dalle': ['Stable Diffusion (local)', 'Leonardo.ai free', 'Bing Image Creator'],
      'midjourney': ['Stable Diffusion', 'Leonardo.ai', 'Playground AI'],
      'github copilot': ['Codeium (free)', 'TabNine free', 'Continue.dev with Ollama'],
      'notion ai': ['Obsidian + Ollama', 'Logseq', 'Anytype'],
    };

    const lowerService = service.toLowerCase();
    for (const [key, alts] of Object.entries(alternatives)) {
      if (lowerService.includes(key)) {
        return alts;
      }
    }

    return ['Search GitHub for open source alternatives', 'Check AlternativeTo.net', 'Try self-hosted options'];
  }
}

export const multiProvider = new MultiProviderEngine();
