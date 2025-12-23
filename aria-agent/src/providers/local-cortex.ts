import { Message, Tool } from '../types.js';
import { getLlama, LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';
import * as path from 'path';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { buildSystemPrompt } from '../brain/index.js';

export class LocalCortex extends EventEmitter {
  private model: LlamaModel | null = null;
  private context: LlamaContext | null = null;
  private session: LlamaChatSession | null = null;
  private modelPath: string;
  private isInitialized: boolean = false;

  constructor() {
    super();
    // SMART PATH RESOLUTION
    // In Dev: ./resources/models/qwen2.5-3b-instruct-q4_k_m.gguf (or brain.gguf)
    // In Prod: resources/models/qwen2.5-3b-instruct-q4_k_m.gguf (relative to binary)
    
    let basePath;
    if (process.env.NODE_ENV === 'development') {
        basePath = path.join(process.cwd(), 'resources', 'models');
    } else {
        // Electron production path
        // Cast process to any to access resourcesPath which is injected by Electron
        basePath = path.join((process as any).resourcesPath, 'models');
    }
    
    // Priority: Specific Qwen file -> generic brain.gguf
    const specificModel = path.join(basePath, 'qwen2.5-3b-instruct-q4_k_m.gguf');
    if (fs.existsSync(specificModel)) {
        this.modelPath = specificModel;
    } else {
        this.modelPath = path.join(basePath, 'brain.gguf');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.emit('status', 'loading_model');
    console.log(`[LocalCortex] Initializing Neural Engine...`);
    console.log(`[LocalCortex] Model Path: ${this.modelPath}`);

    if (!fs.existsSync(this.modelPath)) {
        console.error(`[LocalCortex] CRITICAL: Brain file not found at ${this.modelPath}`);
        this.emit('error', 'brain_missing');
        throw new Error('Brain file missing');
    }

    try {
        const llama = await getLlama();
        
        this.emit('status', 'loading_tensors');
        this.model = await llama.loadModel({
            modelPath: this.modelPath,
            gpuLayers: 'max', // Use Metal/CUDA if available
            useMlock: true,   // Lock model in RAM
        });

        this.emit('status', 'creating_context');
        this.context = await this.model.createContext({
            contextSize: 8192, // High context for complex logic
            threads: 4,
            batchSize: 512
        });

        // Initialize session with System Prompt immediately to prevent generic responses
        // We use an empty system prompt here, but it will be overridden in chat() or set explicitly
        // Actually, it's better to set the DEFAULT system prompt here if possible, 
        // but LlamaChatSession allows setting it in constructor options.
        // Let's load the default Aria prompt.
        const defaultSystemPrompt = buildSystemPrompt([], 'it'); // Default to Italian as requested

        this.session = new LlamaChatSession({
            contextSequence: this.context.getSequence(),
            systemPrompt: defaultSystemPrompt
        });

        this.isInitialized = true;
        this.emit('status', 'ready');
        console.log(`[LocalCortex] Neural Engine Online.`);
    } catch (error) {
        console.error('[LocalCortex] Failed to initialize:', error);
        this.emit('error', 'init_failed');
        throw error;
    }
  }

  // Helper for single prompt generation (needed by CuriosityEngine & GoalManager)
  async generate(prompt: string): Promise<string> {
      return this.chat([{ role: 'user', content: prompt }]);
  }

  // Generate Embeddings using the internal model (Zero-Cost Vector Memory)
  async embed(text: string): Promise<number[]> {
      if (!this.isInitialized || !this.context) {
          await this.initialize();
      }
      
      try {
          const llama = await getLlama();
          // Create temporary embedding context if needed, or use existing model
          const embeddingContext = await this.model!.createEmbeddingContext();
          const embedding = await embeddingContext.getEmbeddingFor(text);
          return Array.from(embedding.vector);
          
      } catch (e) {
          console.warn('[LocalCortex] Embedding generation failed:', e);
          return new Array(1024).fill(0); // Fallback
      }
  }

  async chat(messages: Message[], tools?: Tool[], customSystemPrompt?: string): Promise<string> {
    if (!this.isInitialized || !this.session) {
        await this.initialize();
    }

    // Prepare System Prompt
    // 1. Use custom if provided
    // 2. Or build from tools + default Aria personality
    let systemPrompt = customSystemPrompt || buildSystemPrompt(tools || [], 'it'); // Force Italian default
    
    // Check if we need to reload session due to system prompt change
    // LlamaChatSession doesn't support dynamic system prompt changing easily without reset,
    // but we can create a new session sharing the context sequence?
    // Actually, simply disposing and recreating is the safest way to ensure System Prompt is respected.
    if (this.session) {
        this.session.dispose(); 
        this.session = new LlamaChatSession({
            contextSequence: this.context!.getSequence(),
            systemPrompt: systemPrompt
        });
    }

    // Extract history
    const lastMsg = messages[messages.length - 1];
    
    // Load conversation history if available
    if (messages.length > 1) {
         const chatHistory = messages.slice(0, -1).map(m => ({
             type: m.role === 'user' ? 'user' : 'model',
             text: m.content
         } as any)); 
         
         this.session!.setChatHistory(chatHistory);
    }

    // Generate Response
    try {
        const response = await this.session!.prompt(lastMsg.content, {
            maxTokens: 4096,
            temperature: 0.7, // Slightly higher for creativity/personality
            topP: 0.9
        });

        // VALIDATION: Check for garbage output
        if (!response || response.trim().length === 0) {
            throw new Error("Empty response from Cortex");
        }
        
        // Basic repetition check (e.g., "aaaaa")
        if (/^(.)\1{10,}$/.test(response.trim())) {
             throw new Error("Cortex loop detected (Garbage output)");
        }

        return response;
    } catch (e) {
        console.error('[LocalCortex] Generation failed:', e);
        this.emit('error', 'generation_failed');
        return "Mi dispiace, ho avuto un momentaneo vuoto di memoria. Riprova."; // Graceful fallback
    }
  }
}