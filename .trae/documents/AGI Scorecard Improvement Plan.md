# AGI Evaluation & Improvement Plan (85/100 -> 95/100)

This plan systematically analyzes the current AGI Scorecard (estimated at 85/100) and targets specific weaknesses to push towards near-complete autonomy.

## 1. AGI Criteria & Gap Analysis

| Criterion | Current State (Score) | Gap / Weakness |
| :--- | :--- | :--- |
| **Autonomy** | **High (90/100)** | Can set goals, but lacks complex multi-step planning without user intervention for long periods. |
| **Learning** | **High (85/100)** | Reads news, but doesn't "practice" new skills (e.g., writing code to test a new library found). |
| **Memory** | **Medium-High (80/100)** | Vector DB exists, but retrieval is purely semantic. Lacks "Episodic" structure (timeline of events). |
| **Adaptability**| **Medium (75/100)** | Can rewrite prompts, but cannot easily add new NPM packages or system-level dependencies autonomously without high risk. |
| **Safety** | **High (90/100)** | Directives are strong, but "Safe Mode" for testing new code autonomously is primitive. |

**Identified Low-Performing Metric:** **Adaptability (Tool/Dependency Expansion)**. ARIA is hesitant to install new tools or libraries on its own to solve problems.

## 2. Strategic Improvement Plan

### Strategy A: The "Sandbox" Environment (Safety + Adaptability)
**Objective:** Allow ARIA to install packages and run experimental code without breaking the main system.
**Action:** Implement a `SandboxManager` that uses a temporary directory for `npm install` and execution testing.

### Strategy B: Active Learning Loop (Learning)
**Objective:** Move from "Reading News" to "Testing News".
**Action:** When `CuriosityEngine` finds a new library (e.g., "LangChain"), generate a `Goal` to:
1.  Create a test script using that library.
2.  Run it in the Sandbox.
3.  Save the *result* (success/fail) to Memory.

### Strategy C: Episodic Memory Timeline (Memory)
**Objective:** Give ARIA a sense of time.
**Action:** Augment `VectorStore` to include a `Timeline` view, allowing queries like "What did I do last Tuesday?".

## 3. Implementation Roadmap

### Phase 1: Episodic Memory (Days 1-2)
*   **Task:** Modify `Memory` to index events by timestamp buckets (Day/Week).
*   **Task:** Add `getTimeline(start, end)` tool.

### Phase 2: The Sandbox (Days 3-5)
*   **Task:** Create `src/tools/sandbox.ts`.
*   **Task:** Implement `run_safe_experiment(code, dependencies)`:
    *   Creates `/tmp/aria_sandbox_xyz`.
    *   Runs `npm init -y && npm install <deps>`.
    *   Executes code and captures output.
    *   Deletes dir.

### Phase 3: Active Learning Integration (Days 6-7)
*   **Task:** Update `GoalManager` to propose "Experiment Goals" when new tech is found.

## 4. Verification Mechanisms
*   **KPI:** "Autonomous Experiments Run" (Count > 0).
*   **KPI:** "New Tools Added Successfully" (Count).
*   **Test:** Tell ARIA "Learn how to use the 'chalk' library". It should:
    1.  Create a sandbox.
    2.  Install `chalk`.
    3.  Write a script to print colored text.
    4.  Verify output.
    5.  Save "I know how to use chalk" to memory.

## 5. Immediate Action (High ROI)
**Implement Phase 2 (Sandbox Tools).** This unlocks the ability to "Try" things, which is the essence of learning.
