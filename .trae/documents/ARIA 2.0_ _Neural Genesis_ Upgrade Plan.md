# ARIA 2.0: The "Neural Genesis" Protocol

I have analyzed the startup bottleneck and the aesthetic deficiencies. Here is the execution plan to transform Aria into a premium, instant-on AI instrument.

## Phase 1: Emergency Triage (Non-Blocking Core)
**Diagnosis:** The application waits for the 3GB Brain to load into RAM *before* showing the window.
**The Fix:**
1.  **`src/server.ts`**: Decouple Server Start from Brain Init.
    *   Start Express/WebSocket server **immediately**.
    *   Trigger `initializeAgent()` (Brain loading) asynchronously *after* the server is up.
    *   Broadcast `status: loading_model` events to the frontend via WebSocket.
2.  **`electron/main.js`**: "Instant Launch" Strategy.
    *   Remove the `await startServer()` blocker.
    *   Launch the Window (`createWindow`) in parallel with the Server.
    *   Remove all legacy Ollama checks/dialogs (Deep Cleaning).

## Phase 2: Deep Cleaning (The Purge)
1.  **Codebase Excision**:
    *   Delete `src/providers/ollama.ts`.
    *   Strip `checkOllama`, `startOllama`, and Tray menu references from `electron/main.js`.
2.  **Dependency Cleanup**:
    *   Identify unused packages (`puppeteer` if not used for web browsing, though likely needed for tools).
    *   Strictly remove references to `localhost:11434`.

## Phase 3: The "Neural Aesthetic" (UI Revolution)
1.  **`LiquidBackground.tsx`**: A bespoke CSS-based mesh gradient that breathes (animates opacity/scale) based on AI state (`idle` vs `thinking`).
2.  **`SynapseLoader.tsx`**: A custom SVG animation (nodes connecting) to replace the spinner.
3.  **`ChatInterface.tsx` Refactor**:
    *   Implement "Organic Input": Input bar expands/glows on focus.
    *   "Thinking Mode": Instant UI feedback when Enter is pressed, independent of backend latency.
4.  **Global Styling (`index.css`)**:
    *   Enforce `Geist Mono` / `Inter` stack.
    *   Implement "Bento Grid" glassmorphism classes.

## Phase 4: Verification
1.  **Neural Link Check**: Verify `ChatInterface` correctly handles the `loading_model` event from the backend (showing the Synapse Loader instead of a blank screen).

**Ready to execute?** I will start by rewriting `server.ts` and `electron/main.js` to unblock the startup.