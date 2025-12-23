# Phase 4 & 5: Ultra Minimal Chat UI & Electron Hardening

I have audited the current state. The key issue is the user's new requirement: **"SOLO CHAT"**. The current `App.tsx` has a Bento Grid (`HomeDashboard`) which the user now wants removed in favor of a clean, spaceship-minimal chat interface from start to finish.

## Phase 4: UI Redesign (Chat Shell)
**Goal:** Remove Bento Grid, unify the interface into a single "ChatShell".
**Changes:**
1.  **Refactor `App.tsx`**:
    *   Remove `HomeDashboard` import and usage.
    *   Remove `CommandBar` usage as a separate bottom element (integrate it into `ChatInterface` or keep it but make it part of the flow).
    *   Default view: An empty chat state that is CLEAN (just the Core and a greeting), transitioning seamlessly into conversation.
2.  **Update `ChatInterface.tsx`**:
    *   Ensure it handles the "empty state" gracefully (e.g., "Aria Online" text).
    *   Ensure messages fade in smoothly.
3.  **Update `CommandBar.tsx`**:
    *   Make it "floating" (glassmorphism) as requested.
    *   Ensure buttons (Vision, Voice) are integrated elegantly inside or near the input, not as a separate grid.

## Phase 5: Electron Hardening (Main Process)
**Goal:** Ensure window creation is robust and Apple-like.
**Changes:**
1.  **Update `main.js`**:
    *   Add `vibrancy: 'under-window'` (macOS glass effect).
    *   Ensure `visualEffectState: 'active'`.
    *   Verify `ready-to-show` logic is solid (it is, but I'll double check the sequence).
    *   Add explicit logging for "BOOT TRACE" as requested (Phase 1).

## Phase 6: External Minds (Backend)
**Goal:** Hide provider complexity.
**Changes:**
1.  **Verify `LocalCortex`**: Ensure it defaults to Qwen and doesn't expose "Ollama" errors to the UI.
2.  **UI Status**: Ensure `AgentContext` exposes a simple `status` ('ready', 'thinking', 'offline') instead of provider names.

## Execution Plan
1.  **Modify `main.js`**: Add boot tracing logs + vibrancy settings.
2.  **Modify `App.tsx`**: Simplify to just `Header` + `Core` + `ChatInterface` + `CommandBar` (floating). Remove Bento Grid logic.
3.  **Modify `ChatInterface.tsx`**: Polish the message list and empty state.
4.  **Modify `CommandBar.tsx`**: Ensure it looks like a "spaceship control".

Let's execute the redesign.