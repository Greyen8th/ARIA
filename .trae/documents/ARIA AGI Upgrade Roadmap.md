# AGI Upgrade Roadmap: From 65/100 to 85/100

This roadmap targets specific deficiencies in Autonomy, Knowledge Acquisition, and Self-Reflection to elevate ARIA to a Proto-AGI state.

## 1. Assessment & Metrics (Gap Analysis)
*   **Current Score:** 65/100 (Strong Tools, Weak Initiative)
*   **Weakest Link:** **Active Curiosity & Real-World Knowledge**. ARIA currently "mocks" data fetching (`fetchTrendingTopics` returns a static string) and lacks a true feedback loop for its "Alpha" intelligence.
*   **Goal:** 85/100. Real data ingestion + Recursive self-improvement loops.

## 2. Action Plan

### Task 1: Real-World Sensory Input (The "Eyes & Ears")
**Problem:** `CuriosityEngine` uses fake data. `AlphaTools` are isolated.
**Strategy:** Connect ARIA to live information streams.
**Implementation:**
1.  **Upgrade `CuriosityEngine` (`src/brain/curiosity.ts`):**
    - Replace mock return with real `fetch` calls to:
        - Hacker News API (`https://huggingface.co/api/daily_papers` or similar).
        - GitHub Trending (via `gtrend` or scraping).
    - Add `ingestKnowledge(content)` method to summarize and store findings in Vector Memory.
2.  **Integrate Alpha with Curiosity:**
    - Allow `CuriosityEngine` to trigger `alpha_recon` on interesting domains found in news.

### Task 2: Recursive Optimization (The "Prefrontal Cortex")
**Problem:** `Dream` mode abstracts rules but doesn't *apply* them to code.
**Strategy:** Self-Refactoring based on dream insights.
**Implementation:**
1.  **Enhance `Dream` Mode:**
    - If a "Rule" suggests a code change (e.g., "Always use try-catch in file operations"), generate a `self_update_core` proposal.
    - Create a pending "Evolution Queue" for user approval or auto-execution during low-risk times.

### Task 3: Deep Memory Recall (The "Hippocampus")
**Problem:** Vector search is implemented but not automatically queried before tasks.
**Strategy:** Automatic Context Retrieval.
**Implementation:**
1.  **Modify `AgentExecutor` (`src/agent/executor.ts`):**
    - Before generating a response/plan, automatically query `memory.searchLongTermMemory(userTask)`.
    - Inject relevant past lessons into the System Prompt context window.

### Task 4: Autonomous Goal Setting (The "Will")
**Problem:** ARIA waits for commands.
**Strategy:** Goal generation based on high-level directives.
**Implementation:**
1.  **Add `GoalManager`:**
    - If idle, generate internal tasks based on "Core Directives" (e.g., "Improve security", "Optimize speed").
    - Execute these low-priority tasks in background.

## 3. Timeline & Verification
*   **Phase 1 (Sensory):** Implement Real Fetching & Summarization. (Est: 1 turn)
*   **Phase 2 (Memory):** Implement Automatic Recall in Executor. (Est: 1 turn)
*   **Phase 3 (Autonomy):** Enable Goal Manager. (Est: 2 turns)

## 4. Immediate Next Step (High ROI)
**Execute Phase 1 & 2:** Connect real APIs to Curiosity and inject Memory into Executor. This immediately makes ARIA smarter and more aware.
