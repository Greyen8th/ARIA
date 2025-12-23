# Repair & Upgrade Plan for ARIA Project

This plan addresses the 3 critical blockers identified in the audit (Brain, Hands, Eyes) and updates the system prompt to reflect the new capabilities.

## Task 1: Hybrid Brain Activation (Priority: High)
**Goal:** Enable fallback to Cloud APIs if Ollama is unavailable.
**Target File:** `src/server.ts`

1.  **Modify Imports**:
    - Remove `OllamaProvider` import.
    - Import `multiProvider` singleton from `./providers/multi-provider.js`.
2.  **Update Agent Initialization**:
    - Remove direct `new OllamaProvider()` instantiation.
    - Update `AgentExecutor` instantiation to pass `useMultiProvider: true`.
    - Note: `AgentExecutor` already has logic to use `MultiProviderEngine` if the flag is set, but we need to ensure `server.ts` passes the correct options.
    - **Correction**: `AgentExecutor` creates its own `new MultiProviderEngine()` internally. We should ensure `server.ts` passes `useMultiProvider: true` and removes the redundant `provider` passing if possible, or keeps it as a fallback reference. The current `AgentExecutor` constructor *requires* a `provider` (OllamaProvider) even if `useMultiProvider` is true. I will modify `server.ts` to keep the `OllamaProvider` as the "primary" reference but enable the multi-provider flag.
    - **Better Approach**: I will modify `AgentExecutor` to *not* require `OllamaProvider` if `useMultiProvider` is true, or just instantiate a dummy/default one in `server.ts` to satisfy the type signature, while relying on `multiProvider` for actual execution.

## Task 2: Fix Hands (Mac Compatibility)
**Goal:** Fix compilation errors on macOS by replacing `robotjs` with `@nut-tree/nut-js`.
**Target Files:** `package.json`, `src/tools/os-automation.ts`

1.  **Dependency Updates**:
    - Remove `robotjs`.
    - Add `@nut-tree/nut-js` (and `@nut-tree/template-matcher` if needed, but core is likely enough).
2.  **Code Rewrite (`src/tools/os-automation.ts`)**:
    - Replace `robot.moveMouse(x, y)` with `await mouse.move(down(x), right(y))` or `await mouse.setPosition(new Point(x, y))`.
    - Replace `robot.typeString(text)` with `await keyboard.type(text)`.
    - Replace `robot.keyTap(key)` with `await keyboard.pressKey(...)` / `releaseKey(...)`.
    - Ensure all calls are async (Nut.js is promise-based).

## Task 3: Eyes (Full Desktop Vision)
**Goal:** Enable full desktop screenshots via Electron IPC.
**Target Files:** `electron/main.js`, `electron/preload.js`

1.  **Main Process (`electron/main.js`)**:
    - Import `desktopCapturer`.
    - Add `ipcMain.handle('GET_SCREENSHOT')`.
    - Implementation: `desktopCapturer.getSources({ types: ['screen'], thumbnailSize: ... })` -> Get first source -> `thumbnail.toPNG()` -> Return buffer/base64.
2.  **Preload Script (`electron/preload.js`)**:
    - Expose `getScreenshot: () => ipcRenderer.invoke('GET_SCREENSHOT')` in `contextBridge`.

## Task 4: System Prompt Alignment
**Goal:** Inform the AI of its new capabilities.
**Target File:** `src/agent/prompt-manager.ts`

1.  **Update `getSystemPrompt()`**:
    - Explicitly state: "I have full access to the screen via Electron DesktopCapturer."
    - Explicitly state: "I can control the mouse and keyboard via Nut.js."
    - Explicitly state: "If local LLM fails, I automatically switch to Cloud API."
    - Remove uncertainty/hedging language.

## Verification Plan
- **Brain**: Stop Ollama (`ollama stop` or kill process) -> Send chat message -> Verify it uses Groq/OpenAI (if keys present) or reports graceful failure instead of crash.
- **Hands**: Send command "Move mouse to 500,500" -> Verify cursor moves physically.
- **Eyes**: Send command "Take a screenshot" -> Verify file is saved/analyzed.
