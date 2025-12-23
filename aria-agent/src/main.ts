import * as readline from 'readline';
import chalk from 'chalk';
import { OllamaProvider } from './providers/ollama.js';
import { Memory } from './memory/index.js';
import { AgentExecutor } from './agent/executor.js';
import { SelfImprovement } from './agent/self-improve.js';
import { getAllTools, loadDynamicTools } from './tools/index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const RECOMMENDED_MODELS = [
  { name: 'llama3.2:3b', description: 'Fast, general purpose (2GB)' },
  { name: 'llama3.2:1b', description: 'Very fast, basic tasks (1GB)' },
  { name: 'codellama:7b', description: 'Coding specialist (4GB)' },
  { name: 'deepseek-coder:6.7b', description: 'Advanced coding (4GB)' },
  { name: 'mistral:7b', description: 'Balanced performance (4GB)' },
  { name: 'phi3:mini', description: 'Microsoft Phi-3 mini (2GB)' }
];

async function main() {
  console.log(chalk.cyan('\n===================================='));
  console.log(chalk.cyan.bold('   ARIA - AI Agent'));
  console.log(chalk.cyan('   Autonomous Reasoning Intelligence'));
  console.log(chalk.cyan('====================================\n'));

  // Load dynamic tools
  await loadDynamicTools('./aria-data');
  const allTools = getAllTools();

  const provider = new OllamaProvider({
    name: 'llama3.2:3b',
    provider: 'ollama',
    temperature: 0.7,
    contextWindow: 8192
  });

  console.log(chalk.yellow('Checking Ollama connection...'));
  const isAvailable = await provider.isAvailable();

  if (!isAvailable) {
    console.log(chalk.yellow('\nOllama is not running.'));
    console.log(chalk.white('ARIA will run in "Disconnected/Cloud" mode.'));
    console.log(chalk.gray('Some features may be limited unless you configure cloud keys.'));
  } else {
    console.log(chalk.green('Ollama connected!\n'));
  }

  if (isAvailable) {
    const models = await provider.listModels();
    console.log(chalk.white('Available models:'));
    if (models.length === 0) {
      console.log(chalk.yellow('  No models found. Pulling recommended model...'));
      await provider.pullModel('llama3.2:3b');
    } else {
      models.forEach(m => console.log(chalk.gray(`  - ${m}`)));
    }

    console.log(chalk.white('\nRecommended models to pull:'));
    RECOMMENDED_MODELS.forEach(m => {
      const installed = models.includes(m.name) ? chalk.green(' [installed]') : '';
      console.log(chalk.gray(`  - ${m.name}: ${m.description}${installed}`));
    });
  }

  const memory = new Memory('./aria-data', 50);
  await memory.initialize();
  console.log(chalk.green('\nMemory initialized'));

  const executor = new AgentExecutor({
    provider,
    memory,
    tools: allTools,
    maxIterations: 15,
    verbose: false,
    projectRoot: PROJECT_ROOT
  });

  const selfImprove = new SelfImprovement(memory, provider, './aria-data');
  await selfImprove.initialize();

  console.log(chalk.white('\nAvailable tools:'));
  allTools.forEach(t => console.log(chalk.gray(`  - ${t.name}: ${t.description}`)));

  console.log(chalk.cyan('\n===================================='));
  console.log(chalk.white('Commands:'));
  console.log(chalk.gray('  /help     - Show this help'));
  console.log(chalk.gray('  /tools    - List available tools'));
  console.log(chalk.gray('  /models   - List/switch models'));
  console.log(chalk.gray('  /stats    - Show performance stats'));
  console.log(chalk.gray('  /improve  - Show improvement suggestions'));
  console.log(chalk.gray('  /clear    - Clear conversation history'));
  console.log(chalk.gray('  /exit     - Exit ARIA'));
  console.log(chalk.cyan('====================================\n'));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let currentModel = 'llama3.2:3b';

  const prompt = () => {
    rl.question(chalk.cyan('\nYou: '), async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed.startsWith('/')) {
        await handleCommand(trimmed);
        prompt();
        return;
      }

      console.log(chalk.yellow('\nARIA is thinking...'));

      try {
        const result = await executor.execute(trimmed, (step) => {
          console.log(chalk.gray(`  [${step.action.tool}] ${step.action.reasoning.slice(0, 100)}...`));
        });

        console.log(chalk.green('\nARIA: ') + result);
      } catch (error: any) {
        console.log(chalk.red('\nError: ') + error.message);
      }

      prompt();
    });
  };

  async function handleCommand(cmd: string) {
    const [command, ...args] = cmd.slice(1).split(' ');

    switch (command) {
      case 'help':
        console.log(chalk.white('\nCommands:'));
        console.log(chalk.gray('  /help     - Show this help'));
        console.log(chalk.gray('  /tools    - List available tools'));
        console.log(chalk.gray('  /models   - List/switch models'));
        console.log(chalk.gray('  /stats    - Show performance stats'));
        console.log(chalk.gray('  /improve  - Show improvement suggestions'));
        console.log(chalk.gray('  /clear    - Clear conversation history'));
        console.log(chalk.gray('  /exit     - Exit ARIA'));
        break;
        
      case 'tools':
        console.log(chalk.white('\nAvailable tools:'));
        getAllTools().forEach(t => {
          console.log(chalk.cyan(`\n  ${t.name}`));
          console.log(chalk.gray(`    ${t.description}`));
          console.log(chalk.gray('    Parameters:'));
          t.parameters.forEach(p => {
            console.log(chalk.gray(`      - ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`));
          });
        });
        break;

      case 'models':
        if (args[0]) {
          currentModel = args[0];
          const newProvider = new OllamaProvider({
            name: currentModel,
            provider: 'ollama',
            temperature: 0.7,
            contextWindow: 8192
          });
          console.log(chalk.green(`Switched to model: ${currentModel}`));
        } else {
          if (await provider.isAvailable()) {
             const available = await provider.listModels();
             console.log(chalk.white(`\nCurrent model: ${currentModel}`));
             console.log(chalk.white('\nAvailable models:'));
             available.forEach(m => console.log(chalk.gray(`  - ${m}`)));
          } else {
             console.log(chalk.red('Ollama is not available.'));
          }
        }
        break;

      case 'stats':
        const stats = await selfImprove.analyzePerformance();
        console.log(chalk.white('\nPerformance Statistics:'));
        console.log(chalk.gray(`  Total tasks: ${stats.totalTasks}`));
        console.log(chalk.gray(`  Success rate: ${(stats.successRate * 100).toFixed(1)}%`));
        console.log(chalk.gray(`  Avg duration: ${(stats.avgDuration / 1000).toFixed(1)}s`));
        if (stats.commonFailures.length > 0) {
          console.log(chalk.white('\n  Common failures:'));
          stats.commonFailures.forEach(f => {
            console.log(chalk.gray(`    - ${f.reason}: ${f.count} times`));
          });
        }
        if (stats.toolUsage.length > 0) {
          console.log(chalk.white('\n  Tool usage:'));
          stats.toolUsage.forEach(t => {
            console.log(chalk.gray(`    - ${t.tool}: ${t.count} calls (${(t.successRate * 100).toFixed(0)}% success)`));
          });
        }
        break;

      case 'improve':
        const suggestions = await selfImprove.suggestImprovements();
        if (suggestions.length === 0) {
          console.log(chalk.green('\nNo improvements needed! Keep it up!'));
        } else {
          console.log(chalk.white('\nSuggested improvements:'));
          suggestions.forEach((s, i) => {
            console.log(chalk.cyan(`\n  ${i + 1}. [${s.type}] ${s.description}`));
          });
        }
        break;

      case 'clear':
        await memory.clear();
        console.log(chalk.green('\nConversation history cleared'));
        break;

      case 'exit':
      case 'quit':
        console.log(chalk.cyan('\nGoodbye!\n'));
        process.exit(0);

      default:
        console.log(chalk.red(`Unknown command: ${command}`));
    }
  }

  prompt();
}

main().catch(console.error);
