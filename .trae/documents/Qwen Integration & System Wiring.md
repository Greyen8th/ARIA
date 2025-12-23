# Implementation Plan: Qwen Integration & Wiring

I have analyzed the current codebase (`local-cortex.ts`, `executor.ts`, `main.js`, `brain/index.ts`) and identified the necessary changes to integrate the Qwen model and ensure proper UI-Backend wiring.

## Phase 1: Brain Configuration (`local-cortex.ts`)
**Goal:** Implement robust loading for `qwen2.5-3b-instruct-q4_k_m.gguf` with System Prompt injection.

**Steps:**
1.  **Model Path Update:** Ensure the class specifically looks for `qwen2.5-3b-instruct-q4_k_m.gguf` (or a generic `brain.gguf` if renamed, but the user specified the filename, so I'll add logic to detect it).
2.  **System Prompt Injection:** Modify the `chat` method to **always** prepend the Aria System Prompt (from `brain/index.ts`) if the conversation history doesn't already have it.
    *   *Prompt Source:* `ARIA_BRAIN.identity` + `ARIA_BRAIN.mission` + ... (already available in `brain/index.ts`).
3.  **Context Management:** Ensure `LlamaChatSession` is initialized with this system prompt.

## Phase 2: Wiring (IPC & Event Handling)
**Goal:** Connect UI actions to Backend logic.

**Steps:**
1.  **`electron/main.js`**:
    *   Add `ipcMain.handle('analyze-code', ...)` listener.
    *   This handler will forward the request to the `AgentExecutor` (via the existing WebSocket or a new internal channel if possible, but keeping it consistent with WS is safer for now). *Correction:* Since `main.js` runs the server as a child process, it can't directly call `executor`. The UI (Renderer) should communicate with the Server (Node) via WebSocket for AI tasks. The `ipcMain` is for OS-level tasks (Screenshots, File I/O).
    *   **Clarification:** The user asked for `analyze-code` IPC. I will implement it, but it needs to route to the AI.
    *   *Strategy:* The UI sends `analyze-code` via WebSocket (standard AI task), OR via IPC if it needs to read a local file *first* and then send content to AI.
    *   *Refined Strategy:* I will stick to the existing WebSocket architecture for AI tasks to maintain history. The "Analyze Code" button in UI should just send a specific text prompt to the WS.

## Phase 3: Error Handling
**Goal:** Detect "garbage" output and reset.

**Steps:**
1.  **`local-cortex.ts`**: Add output validation in `chat()`. If output is empty or pure gibberish (e.g., repeating chars), throw a specific error.
2.  **`AgentContext.tsx` (Frontend)**: Handle the error by showing a "Neural Link Unstable" message (already planned/done in previous turn, but will double check).

## Execution Steps
1.  **Update `local-cortex.ts`**: Implement Qwen loading and System Prompt injection.
2.  **Update `electron/preload.js`**: Expose necessary IPCs (if any new ones are strictly needed).
3.  **Update `main.js`**: Add the `analyze-code` handler (mocked to prove wiring, or connected if feasible).

*Self-Correction during planning:* The user specifically asked for `analyze-code` IPC in `main.ts`. I will implement it there to satisfy the requirement, perhaps allowing `main.ts` to read a file content and return it to UI, which then sends it to the Brain.

**Ready to execute.**