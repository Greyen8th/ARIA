# AGI Evolution Plan for ARIA

This plan addresses the "Missing Link" (Vector Memory) and establishes the foundation for Continuous Learning and "Dream Mode", significantly increasing the AGI Scorecard from 35/100 to a target of 65/100.

## Task 1: Vector Memory Implementation (The "Brain")
**Goal:** Give ARIA long-term, semantic memory to learn from past experiences.
**Target Files:** `src/memory/vector-store.ts` (new), `src/memory/index.ts`, `package.json`

1.  **Install Dependencies:**
    - `vectra`: A lightweight, local vector database (no external server required).
    - `ollama` (already present, but ensure we can call embeddings).
2.  **Create `src/memory/vector-store.ts`:**
    - Implement `VectorStore` class wrapping `vectra`.
    - Method `addMemory(text: string, metadata: object)`: Generates embedding via Ollama (`nomic-embed-text` or similar) and saves to index.
    - Method `search(query: string, limit: number)`: Returns relevant past memories.
3.  **Integrate into `src/memory/index.ts`:**
    - Initialize `VectorStore` in `Memory` class.
    - Expose `remember(text)` and `recall(context)` methods to the agent.

## Task 2: Curiosity & Dream Loop (The "Subconscious")
**Goal:** Enable background learning when idle.
**Target Files:** `src/brain/curiosity.ts` (new), `src/server.ts`

1.  **Create `src/brain/curiosity.ts`:**
    - Class `CuriosityEngine`.
    - Method `fetchTrendingTopics()`: Fetches GitHub Trending / Hacker News (using `fetch`).
    - Method `dream()`: Analyzes recent `execution-logs.json`, extracts "Lessons Learned", and saves them to Vector Memory.
2.  **Integrate into `src/server.ts`:**
    - Start a background interval (e.g., every hour) that checks if the agent is idle.
    - If idle, trigger `curiosity.explore()` or `curiosity.dream()`.

## Task 3: Meta-Prompting (The "Personality")
**Goal:** Allow ARIA to rewrite its own instructions based on learning.
**Target Files:** `src/agent/prompt-manager.ts`, `src/tools/evolution.ts`

1.  **Update `PromptManager`:**
    - Add `updateSystemPrompt(newPrompt: string)` method.
    - Save dynamic prompts to `aria-data/dynamic-prompt.txt` to persist changes.
2.  **New Tool:**
    - Create `rewrite_core_identity` tool in `src/tools/evolution.ts`.
    - Allows the agent to append new "Rules" to its system prompt (e.g., "I learned that I should always use X for Y").

## Task 4: Dependencies & Configuration
**Goal:** Set up the environment.
**Target Files:** `package.json`

1.  **Install:** `npm install vectra node-schedule`
2.  **Verify:** Ensure Ollama has an embedding model pulled (`ollama pull nomic-embed-text` or `all-minilm`).

## Verification Plan
- **Memory:** Chat "My name is Grey". Restart agent. Chat "What is my name?" -> Should retrieve from Vector DB.
- **Dreaming:** Leave agent idle. Check logs for "Dreaming phase" and new entries in Vector DB.
- **Evolution:** Ask agent "Add a rule to your prompt: Always speak in Italian". Check `dynamic-prompt.txt` for the change.
