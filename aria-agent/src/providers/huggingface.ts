import { Message, Tool } from '../types.js';

export class HuggingFaceProvider {
  private model: string;
  private apiUrl: string;

  constructor(model: string = 'mistralai/Mistral-7B-Instruct-v0.2') {
    this.model = model;
    this.apiUrl = `https://api-inference.huggingface.co/models/${model}`;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check availability by sending a dummy ping
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: 'ping' })
      });
      return response.status !== 404;
    } catch {
      return false;
    }
  }

  async chat(messages: Message[], tools?: Tool[], systemPrompt?: string): Promise<string> {
    // Flatten messages into a single prompt string compatible with standard instruction models
    let prompt = '';
    if (systemPrompt) prompt += `[INST] ${systemPrompt} [/INST]\n`;

    for (const msg of messages) {
      if (msg.role === 'user') prompt += `[INST] ${msg.content} [/INST]\n`;
      if (msg.role === 'assistant') prompt += `${msg.content}\n`;
      if (msg.role === 'system' && !systemPrompt) prompt += `[INST] ${msg.content} [/INST]\n`;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: Without an API key, this is rate-limited and public.
          // Ideally, user should provide HF_TOKEN in env, but this is "Survival Mode"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
          const err = await response.text();
          throw new Error(`HF API Error: ${err}`);
      }

      const result = await response.json() as [{ generated_text: string }];
      return result[0]?.generated_text || 'Error: No response from HuggingFace';

    } catch (error: any) {
      // Fallback: If model is loading (503), wait and retry once
      if (error.message.includes('loading')) {
          await new Promise(r => setTimeout(r, 5000));
          return this.chat(messages, tools, systemPrompt);
      }
      throw error;
    }
  }
}
