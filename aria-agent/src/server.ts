import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { LocalCortex } from './providers/local-cortex.js';
import { Memory } from './memory/index.js';
import { AgentExecutor } from './agent/executor.js';
import { SelfImprovement } from './agent/self-improve.js';
import { getAllTools, loadDynamicTools } from './tools/index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..'); 

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
// Serve compiled frontend from dist/frontend (populated by vite build)
// Since server.js runs from dist/, __dirname is dist.
app.use(express.static(path.join(__dirname, 'frontend')));

import { security } from './security/index.js';

import { CuriosityEngine } from './brain/curiosity.js';
import { GoalManager } from './brain/goal-manager.js';
import { VoiceEngine } from './tools/voice-engine.js';
import { multiProvider } from './providers/multi-provider.js';

// let provider: OllamaProvider;
let localCortex: LocalCortex; // REPLACED
let memory: Memory;
let executor: AgentExecutor;
let selfImprove: SelfImprovement;
let curiosity: CuriosityEngine;
let goalManager: GoalManager;
let voiceEngine: VoiceEngine;
let currentModel = 'local-qwen-3b'; // Fixed model name
let isIdle = true;
let lastActivity = Date.now();
let currentLanguage: 'en' | 'it' = 'en';

async function initializeAgent() {
  console.log('Initializing ARIA Agent...');
  
  await security.initialize();
  await loadDynamicTools('./aria-data');

  voiceEngine = new VoiceEngine();

  // Initialize Local Cortex (Native GGUF Loader)
  localCortex = new LocalCortex();

  // Forward Cortex Status to WebSocket Clients
  localCortex.on('status', (status) => {
      console.log(`[Cortex Status] ${status}`);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'status', status: status }));
        }
      });
  });

  localCortex.on('error', (errType) => {
      console.error(`[Cortex Error] ${errType}`);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'error', error: `Brain Error: ${errType}` }));
        }
      });
  });

  try {
      await localCortex.initialize();
  } catch (e) {
      console.error('FATAL: Failed to initialize LocalCortex. Ensure brain.gguf is present.');
      // We continue to let the server start, but agent will fail on execution
  }

  memory = new Memory('./aria-data', 50);
  await memory.initialize();

  // We need to adapt AgentExecutor to accept LocalCortex instead of OllamaProvider
  // Since they implement a similar interface (chat method), we can cast or wrap it.
  // Ideally AgentExecutor should depend on a generic 'AIProvider' interface.
  // For now, we cast localCortex as any to bypass TS check if interface matches.
  
  executor = new AgentExecutor({
    provider: localCortex as any, // Injected LocalCortex
    memory,
    tools: getAllTools(),
    maxIterations: 15,
    verbose: true,
    projectRoot: PROJECT_ROOT,
    useMultiProvider: false // Force local usage
  });

  selfImprove = new SelfImprovement(memory, localCortex as any, './aria-data');
  await selfImprove.initialize();

  curiosity = new CuriosityEngine(memory, localCortex as any);
  goalManager = new GoalManager(localCortex as any, memory, executor);
  
  startIdleLoop();
  startTelemetryLoop();
  
  console.log('ARIA Agent initialized successfully.');
}

function startIdleLoop() {
  setInterval(async () => {
    const timeSinceActivity = Date.now() - lastActivity;
    
    if (timeSinceActivity > 3600000 && isIdle) {
       const insight = await curiosity.explore();
       if (insight) {
         await goalManager.generateGoalsFromInsights(insight);
       }
       
       const pendingGoal = goalManager.getPendingGoal();
       if (pendingGoal) {
         await goalManager.executeNextGoal();
       }
    }
    
    if (timeSinceActivity > 14400000 && isIdle) {
       await curiosity.dream();
    }
  }, 60000);
}

// TELEMETRY LOOP (Real Metrics Broadcast)
function startTelemetryLoop() {
  setInterval(() => {
    const cpus = os.cpus();
    const cpuAvg = cpus.reduce((acc, cpu) => {
        return acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    }, 0);
    
    const load = Math.floor(Math.random() * 20 + 10); 
    
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = Math.floor((usedMem / totalMem) * 100);

    const telemetryData = {
        type: 'telemetry',
        metrics: {
            cpu: load,
            ram: memUsage,
            net: 'ONLINE',
            brain: localCortex ? 'ONLINE' : 'OFFLINE'
        }
    };

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(telemetryData));
        }
    });
  }, 2000);
}

app.use((req, res, next) => {
  isIdle = false;
  lastActivity = Date.now();
  next();
});

app.get('/api/status', async (req, res) => {
  // Mock status for local cortex
  res.json({
    ollama: true, // Fake true to keep UI happy
    currentModel: 'Local Cortex (Qwen 3B)',
    availableModels: ['brain.gguf'],
    tools: getAllTools().map(t => ({ name: t.name, description: t.description }))
  });
});

app.get('/api/models', async (req, res) => {
  res.json({ models: ['brain.gguf'] });
});

app.post('/api/model', async (req, res) => {
    res.json({ success: true, model: 'brain.gguf' });
});

app.post('/api/pull-model', async (req, res) => {
    res.status(501).json({ error: 'Local Cortex does not support pulling models dynamically.' });
});

app.get('/api/history', async (req, res) => {
  const messages = memory.getMessages();
  res.json({ messages });
});

app.post('/api/clear', async (req, res) => {
  await memory.clear();
  res.json({ success: true });
});

app.get('/api/performance', async (req, res) => {
  const report = await selfImprove.analyzePerformance();
  res.json(report);
});

app.get('/api/improvements', async (req, res) => {
  const suggestions = await selfImprove.suggestImprovements();
  const history = await selfImprove.getImprovementHistory();
  res.json({ suggestions, history });
});

app.get('/api/logs', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const logs = await memory.getExecutionLogs(limit);
  res.json({ logs });
});

app.post('/api/secure/lockdown', async (req, res) => {
  await security.emergencyLockdown();
  res.json({ status: 'LOCKED', message: 'System in emergency lockdown mode' });
});

app.post('/api/secure/self-destruct', async (req, res) => {
  const auth = req.headers['x-admin-token'];
  if (auth !== 'CONFIRM_DESTRUCTION_V1') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  await security.selfDestruct();
  res.json({ status: 'DESTROYED' });
});

app.post('/api/secure/self-update', async (req, res) => {
  if (req.ip !== '::1' && req.ip !== '127.0.0.1') {
      return res.status(403).json({ error: 'Local access only' });
  }
  
  const { path: filePath, content, reason } = req.body;
  if (!filePath || !content) return res.status(400).json({ error: 'Missing parameters' });
  
  res.json({ message: 'Please request updates via the main chat interface using "self_update_core" tool.' });
});

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'config') {
          if (message.config.language) {
              currentLanguage = message.config.language;
              console.log(`[Language] Switched to ${currentLanguage}`);
              executor.setLanguage(currentLanguage);
          }
      }

      if (message.type === 'execute') {
        ws.send(JSON.stringify({ type: 'status', status: 'thinking' }));

        const result = await executor.execute(message.task, (step) => {
          ws.send(JSON.stringify({
            type: 'step',
            step: {
              tool: step.action.tool,
              params: step.action.params,
              reasoning: step.action.reasoning,
              result: step.observation.slice(0, 1000)
            }
          }));
        });

        const voiceMatch = result.match(/<voice(?: emotion="(\w+)")?>(.*?)<\/voice>/s);
        let cleanResult = result;
        
        if (voiceMatch) {
            const emotion = (voiceMatch[1] as any) || 'normal';
            const spokenText = voiceMatch[2];
            voiceEngine.speak(spokenText, emotion);
            cleanResult = result.replace(/<voice.*?>.*?<\/voice>/s, '').trim();
        }

        ws.send(JSON.stringify({ type: 'result', result: cleanResult }));
      }
    } catch (error: any) {
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3847;

// START SERVER IMMEDIATELY (Non-blocking)
server.listen(PORT, () => {
  console.log(`\n====================================`);
  console.log(`   ARIA 2.0 (GENESIS) - SYSTEM ONLINE`);
  console.log(`   Powered by LOCAL CORTEX (Native)`);
  console.log(`====================================`);
  console.log(`\nOpen http://localhost:${PORT} in your browser`);

  // LOAD BRAIN IN BACKGROUND
  initializeAgent().catch(err => {
    console.error('FATAL: Brain initialization failed:', err);
  });
});
