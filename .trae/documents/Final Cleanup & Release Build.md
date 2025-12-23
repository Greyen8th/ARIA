# Forensic Audit & Final Fix Plan (Phase 7 & 8)

I have already implemented the critical P0/P1 fixes (Icon, Server Crash, UI Black Screen) in the previous turn. This plan focuses on the final requested cleanup and release build to ensure 100% compliance with the "Forensic Audit" request.

## Phase 7: Cleanup & Dependency Audit
**Goal:** Remove unused/legacy dependencies and ensure no "Ollama" strings remain.

1.  **Dependency Removal:**
    *   The user explicitly requested removing "ollama" and "old logic".
    *   I checked `package.json` and `node-llama-cpp` is correctly used.
    *   *Action:* I will verify no `ollama` package is in `dependencies` (it's not, but I'll double check for `langchain` or others).
    *   *Action:* Search the entire `src` directory for the string "ollama" (case insensitive) and remove/replace any remaining comments or dead code.

2.  **Config Verification:**
    *   `package.json` build config looks correct (`build/icon.icns`).
    *   `main.js` now has the `checkPort` and `loading.html` logic.

## Phase 8: Release Build (Build 3.0)
**Goal:** Prove reproducible build.

1.  **Clean Slate:**
    *   `rm -rf dist release node_modules/.cache`
2.  **Build Sequence:**
    *   `npm run build:frontend` (Vite)
    *   `npm run bundle-server` (Esbuild)
    *   `npm run dist:mac` (Electron Builder)
3.  **Verification:**
    *   I will output the exact commands for the user to run.

## Final Output Generation
I will generate the requested **FORENSIC_AUDIT_REPORT.md** (updated) with the final status of all phases.

**Execution Steps:**
1.  Search & Destroy "Ollama" strings.
2.  Run the clean build commands.
3.  Produce the final report.