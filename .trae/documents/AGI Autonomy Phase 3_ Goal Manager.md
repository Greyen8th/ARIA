# AGI Autonomy: Goal Manager Implementation (Phase 3)

This plan implements the "Will" of the AI: the ability to generate and execute its own tasks based on "Core Directives" when idle.

## Task 1: Goal Manager Implementation
**Goal:** Create a system that generates low-priority background tasks.
**Target File:** `src/brain/goal-manager.ts` (New)

1.  **Class `GoalManager`:**
    - `generateGoals()`: Queries the LLM (with a special system prompt) to look at current "Curiosity Reports" (from `CuriosityEngine`) or "Dream Insights" and propose a task.
    - **Example Prompt:** "You are the Goal Manager. Based on the fact that you learned about 'Express Vulnerabilities' today, what should you do? Task: 'Audit local server code'."
    - `queueGoal(goal: string)`: Adds to a priority queue.

## Task 2: Integration with Server Loop
**Goal:** Connect Goal Manager to the Idle Loop.
**Target File:** `src/server.ts`

1.  **Update `startIdleLoop`:**
    - If `curiosity.explore()` finds something interesting, trigger `goalManager.generateGoals()`.
    - If `goalManager` has a pending goal AND the system is idle, execute it via `executor.execute()`.
    - **Safety:** Tag these executions as "AUTONOMOUS" so they don't block user interaction (interruptible).

## Task 3: "Directive" System Prompt
**Goal:** Define what the AI *cares* about.
**Target File:** `src/agent/prompt-manager.ts`

1.  **Add `directives.txt`:**
    - "Directive 1: Maintain system security."
    - "Directive 2: Optimize code performance."
    - "Directive 3: Learn new frameworks."
    - These guide the `GoalManager` on *what* to want.

## Verification
- **Test:** Leave system idle.
- **Expectation:**
    1.  Curiosity fetches "New Express CVE found".
    2.  Goal Manager generates: "Scan project for Express version".
    3.  Executor runs the scan autonomously.
    4.  Log shows: "AUTONOMOUS TASK COMPLETED".
