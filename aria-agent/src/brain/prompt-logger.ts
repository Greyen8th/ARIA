import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

export interface PromptLog {
  timestamp: number;
  sessionId: string;
  promptHash: string;
  promptLength: number;
  language: string;
  toolCount: number;
  source: 'brain' | 'executor' | 'curiosity' | 'goal-manager';
}

let currentSessionId: string = uuid();
const logs: PromptLog[] = [];
const DATA_DIR = './aria-data';

export function getSessionId(): string {
  return currentSessionId;
}

export function newSession(): string {
  currentSessionId = uuid();
  return currentSessionId;
}

export function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

export function logPromptUsage(
  prompt: string,
  source: PromptLog['source'],
  language: string = 'en',
  toolCount: number = 0
): PromptLog {
  const log: PromptLog = {
    timestamp: Date.now(),
    sessionId: currentSessionId,
    promptHash: hashPrompt(prompt),
    promptLength: prompt.length,
    language,
    toolCount,
    source
  };

  logs.push(log);

  console.log(`[PROMPT-COMPLIANCE] ${log.source} | hash=${log.promptHash} | len=${log.promptLength} | lang=${log.language} | tools=${log.toolCount}`);

  return log;
}

export async function persistPromptLogs(): Promise<void> {
  const logsDir = path.join(DATA_DIR, 'prompt-logs');
  await fs.mkdir(logsDir, { recursive: true });

  const filename = `prompts-${new Date().toISOString().split('T')[0]}.json`;
  const filePath = path.join(logsDir, filename);

  let existingLogs: PromptLog[] = [];
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    existingLogs = JSON.parse(content);
  } catch {}

  const allLogs = [...existingLogs, ...logs];
  await fs.writeFile(filePath, JSON.stringify(allLogs, null, 2));

  logs.length = 0;
}

export function getRecentLogs(count: number = 50): PromptLog[] {
  return logs.slice(-count);
}

export function verifyPromptCompliance(actualPrompt: string, expectedHash: string): boolean {
  const actualHash = hashPrompt(actualPrompt);
  const matches = actualHash === expectedHash;

  if (!matches) {
    console.warn(`[PROMPT-COMPLIANCE] MISMATCH! Expected: ${expectedHash}, Got: ${actualHash}`);
  }

  return matches;
}

setInterval(() => {
  if (logs.length > 0) {
    persistPromptLogs().catch(console.error);
  }
}, 60000);
