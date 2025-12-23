import { Memory } from '../memory/index.js';
import { OllamaProvider } from '../providers/ollama.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CuriosityEngine {
  private memory: Memory;
  private provider: OllamaProvider;
  
  constructor(memory: Memory, provider: OllamaProvider) {
    this.memory = memory;
    this.provider = provider;
  }

  async explore(): Promise<string | null> {
    console.log('[Curiosity] Exploring new topics...');
    try {
        const trending = await this.fetchTrendingTopics();
        if (trending) {
            await this.memory.addLongTermMemory(`Trend Report: ${trending}`, { source: 'curiosity_loop' });
            console.log('[Curiosity] Learned about:', trending.slice(0, 50) + '...');
            return trending;
        }
    } catch (e) {
        console.error('[Curiosity] Exploration failed:', e);
    }
    return null;
  }

  async dream(): Promise<void> {
    console.log('[Dream] Entering REM sleep cycle...');
    try {
        const logs = await this.memory.getExecutionLogs(20);
        if (logs.length === 0) return;

        // Abstract lessons from logs
        const prompt = `Analyze these recent execution logs and extract 3 general rules or lessons for future tasks.
        Logs: ${JSON.stringify(logs.slice(-5))}
        
        Format:
        1. Rule 1
        2. Rule 2
        3. Rule 3`;

        const lessons = await this.provider.generate(prompt);
        await this.memory.addLongTermMemory(lessons, { type: 'dream_insight', timestamp: Date.now() });
        console.log('[Dream] Consolidated wisdom:', lessons);
        
    } catch (e) {
        console.error('[Dream] Nightmare occurred:', e);
    }
  }

  private async fetchTrendingTopics(): Promise<string | null> {
    try {
      // 1. Fetch Hacker News Top Stories
      const hnRes = await fetch('https://huggingface.co/api/daily_papers');
      if (hnRes.ok) {
         const papers = await hnRes.json();
         // Extract titles of top 5 papers
         const topics = papers.slice(0, 5).map((p: any) => `- ${p.paper.title}`).join('\n');
         return `Latest AI Research Papers:\n${topics}`;
      }
      
      // Fallback: Use a generic tech news RSS (simulated via known endpoint or just return null to trigger mock)
      // Actually, let's try GitHub Trending via a public proxy or just stick to the specific API above.
      return null;
    } catch (e) {
      console.warn('Failed to fetch real trends:', e);
      return null;
    }
  }
}
