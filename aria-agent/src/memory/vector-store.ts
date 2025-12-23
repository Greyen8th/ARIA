import { LocalIndex } from 'vectra';
import * as path from 'path';
import * as fs from 'fs/promises';
import { LocalCortex } from '../providers/local-cortex.js';

export interface MemoryItem {
  id: string;
  text: string;
  metadata: Record<string, any>;
  score?: number;
}

export class VectorStore {
  private index: LocalIndex;
  private dataDir: string;
  private indexName: string = 'aria-memory';
  private provider: LocalCortex | null = null; // Injected Provider

  constructor(dataDir: string) {
    this.dataDir = path.join(dataDir, 'vector-db');
    this.index = new LocalIndex(path.join(this.dataDir, this.indexName));
  }

  // Dependency Injection for Provider
  setProvider(provider: LocalCortex) {
      this.provider = provider;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    
    if (!(await this.index.isIndexCreated())) {
      await this.index.createIndex();
    }
  }

  // Generate embedding using Local Cortex (Native)
  private async getEmbedding(text: string): Promise<number[]> {
    if (!this.provider) {
        console.warn('VectorStore: No provider set, returning zero vector.');
        return new Array(1024).fill(0);
    }

    try {
        // Use the native embedding method
        return await this.provider.embed(text);
    } catch (error) {
        console.error('VectorStore: Embedding error:', error);
        return new Array(1024).fill(0);
    }
  }

  async addMemory(text: string, metadata: Record<string, any> = {}): Promise<void> {
    const vector = await this.getEmbedding(text);
    await this.index.insertItem({
      vector,
      metadata: { text, ...metadata, timestamp: Date.now() }
    });
  }

  async search(query: string, limit: number = 3): Promise<MemoryItem[]> {
    const vector = await this.getEmbedding(query);
    const results = await this.index.queryItems(vector, query, limit);
    
    return results.map(item => ({
      id: item.item.id,
      text: item.item.metadata.text as string,
      metadata: item.item.metadata,
      score: item.score
    }));
  }
}
