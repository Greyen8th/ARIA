import { OllamaProvider } from '../providers/ollama.js';
import { Memory } from '../memory/index.js';
import { AgentExecutor } from '../agent/executor.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Goal {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: number;
}

export class GoalManager {
  private goals: Goal[] = [];
  private provider: OllamaProvider;
  private memory: Memory;
  private executor: AgentExecutor;
  private storagePath: string;

  constructor(provider: OllamaProvider, memory: Memory, executor: AgentExecutor, dataDir: string = './aria-data') {
    this.provider = provider;
    this.memory = memory;
    this.executor = executor;
    this.storagePath = path.join(dataDir, 'goals.json');
    this.loadGoals();
  }

  private async loadGoals() {
      try {
          const content = await fs.readFile(this.storagePath, 'utf-8');
          this.goals = JSON.parse(content);
          console.log(`[GoalManager] Loaded ${this.goals.length} goals from storage.`);
      } catch (e) {
          // File likely doesn't exist yet
          this.goals = [];
      }
  }

  private async saveGoals() {
      try {
          await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
          await fs.writeFile(this.storagePath, JSON.stringify(this.goals, null, 2), 'utf-8');
      } catch (e) {
          console.error('[GoalManager] Failed to save goals:', e);
      }
  }

  async generateGoalsFromInsights(insight: string): Promise<void> {
    const prompt = `
    You are the Goal Manager for an Autonomous AI Agent.
    
    CORE DIRECTIVES:
    1. Maintain system security and integrity.
    2. Optimize code performance and reliability.
    3. Continuously learn and adapt to new technologies.

    CONTEXT:
    The agent just discovered this new information/insight:
    "${insight}"

    TASK:
    Based on this insight and your directives, generate ONE concrete, actionable task for the agent to perform autonomously.
    
    CRITICAL: If the insight involves a new library, tool, or coding pattern, PREFER creating an experiment task using 'run_safe_experiment'.
    Example: "Create a sandbox experiment to test the features of library X."

    If the insight is trivial, return "NO_ACTION".

    FORMAT:
    {
      "task": "The specific task description",
      "priority": "low" | "medium" | "high",
      "reason": "Why this task is important based on the insight"
    }
    `;

    try {
      const response = await this.provider.generate(prompt);
      
      if (response.includes("NO_ACTION")) return;

      // Extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const goalData = JSON.parse(jsonMatch[0]);
        await this.queueGoal(goalData.task, goalData.priority, goalData.reason);
      }
    } catch (error) {
      console.error('[GoalManager] Failed to generate goal:', error);
    }
  }

  async queueGoal(description: string, priority: 'low' | 'medium' | 'high', reason: string) {
    const goal: Goal = {
      id: Date.now().toString(),
      description,
      priority,
      reason,
      status: 'pending',
      timestamp: Date.now()
    };
    this.goals.push(goal);
    await this.saveGoals(); // Persist immediately
    console.log(`[GoalManager] New Goal Queued: ${description} (Priority: ${priority})`);
  }

  getPendingGoal(): Goal | undefined {
    // Return highest priority pending goal
    return this.goals
      .filter(g => g.status === 'pending')
      .sort((a, b) => {
        const pMap = { high: 3, medium: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      })[0];
  }

  async executeNextGoal(): Promise<void> {
    const goal = this.getPendingGoal();
    if (!goal) return;

    console.log(`[GoalManager] Executing Autonomous Goal: ${goal.description}`);
    goal.status = 'in_progress';
    await this.saveGoals();
    
    try {
      // Execute via main agent
      const result = await this.executor.execute(`[AUTONOMOUS GOAL] ${goal.description}`);
      
      goal.status = 'completed';
      console.log(`[GoalManager] Goal Completed: ${goal.id}`);
      
      // Log success to long-term memory
      await this.memory.addLongTermMemory(`Completed autonomous goal: ${goal.description}`, {
        type: 'autonomous_achievement',
        result: result.slice(0, 200)
      });
      
    } catch (error) {
      goal.status = 'failed';
      console.error(`[GoalManager] Goal Failed: ${goal.id}`, error);
    }
    
    await this.saveGoals();
  }
}
