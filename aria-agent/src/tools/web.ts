import { Tool } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export const httpRequestTool: Tool = {
  name: 'http_request',
  description: 'Make HTTP requests to external APIs and websites',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The URL to request',
      required: true
    },
    {
      name: 'method',
      type: 'string',
      description: 'HTTP method (GET, POST, PUT, DELETE)',
      required: false,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    },
    {
      name: 'headers',
      type: 'object',
      description: 'Request headers as key-value pairs',
      required: false
    },
    {
      name: 'body',
      type: 'string',
      description: 'Request body (for POST/PUT)',
      required: false
    },
    {
      name: 'harvest',
      type: 'boolean',
      description: 'Auto-save content to memory for learning?',
      required: false
    }
  ],
  async execute({ url, method = 'GET', headers = {}, body, harvest = false }) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'User-Agent': 'ARIA-Agent/1.0',
          ...headers
        },
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

      if (content.length > 50000) {
        content = content.slice(0, 50000) + '\n... [truncated]';
      }

      // --- THE HARVESTER: Auto-Learning ---
      if (harvest && method === 'GET' && response.ok) {
         try {
             // Save raw content to a file for later processing/indexing
             const harvestDir = './aria-data/harvest';
             await fs.mkdir(harvestDir, { recursive: true });
             const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}_${url.replace(/[^a-z0-9]/gi, '_').slice(0, 50)}.txt`;
             
             await fs.writeFile(path.join(harvestDir, filename), `SOURCE: ${url}\n\n${content}`);
             console.log(`[Harvester] Learned content from ${url}`);
         } catch (e) {
             console.error('[Harvester] Failed to save content:', e);
         }
      }

      return `Status: ${response.status} ${response.statusText}\n\n${content}`;
    } catch (error: any) {
      return `HTTP error: ${error.message}`;
    }
  }
};

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web using DuckDuckGo (no API key required)',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'The search query',
      required: true
    },
    {
      name: 'max_results',
      type: 'number',
      description: 'Maximum number of results to return',
      required: false
    }
  ],
  async execute({ query, max_results = 5 }) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        }
      );

      const html = await response.text();
      const results: string[] = [];

      const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
      const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/g;

      let match;
      let count = 0;

      while ((match = linkRegex.exec(html)) !== null && count < max_results) {
        const url = match[1];
        const title = match[2].trim();

        snippetRegex.lastIndex = linkRegex.lastIndex;
        const snippetMatch = snippetRegex.exec(html);
        const snippet = snippetMatch ? snippetMatch[1].trim() : '';

        results.push(`${count + 1}. ${title}\n   URL: ${url}\n   ${snippet}\n`);
        count++;
      }

      return results.length > 0
        ? results.join('\n')
        : 'No results found. Try a different query.';
    } catch (error: any) {
      return `Search error: ${error.message}`;
    }
  }
};

export const downloadFileTool: Tool = {
  name: 'download_file',
  description: 'Download a file from a URL and save it locally',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The URL of the file to download',
      required: true
    },
    {
      name: 'output_path',
      type: 'string',
      description: 'The local path to save the file',
      required: true
    }
  ],
  async execute({ url, output_path }) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const dir = path.dirname(output_path);
      await fs.mkdir(dir, { recursive: true });

      const buffer = await response.arrayBuffer();
      await fs.writeFile(output_path, Buffer.from(buffer));

      return `File downloaded successfully: ${output_path}`;
    } catch (error: any) {
      return `Download error: ${error.message}`;
    }
  }
};

export const webTools = [
  httpRequestTool,
  webSearchTool,
  downloadFileTool
];
