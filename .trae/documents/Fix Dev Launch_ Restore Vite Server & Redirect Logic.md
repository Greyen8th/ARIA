# Phase 7: Debugging Black Screen/Stuck Loading

The user reports that after the initial loading screen ("INITIALIZING NEURAL CORE"), the app seems to start but then shows a black/blank screen or doesn't transition correctly to the main UI.

## Analysis of Root Causes
1.  **Transition Logic Flaw:** The `loading.html` uses `window.location.href = TARGET_URL` (where `TARGET_URL` is `http://localhost:3847`).
    *   **Issue:** If the Vite Dev Server (port 5173?) isn't what's being served on 3847, this might be wrong.
    *   *Correction:* In `dev` mode, we usually serve the frontend via Vite (port 5173) and the backend via Node (port 3847).
    *   *Check:* `server.ts` usually serves the static frontend in production, but in dev, we want HMR.
    *   *Current `main.js` logic:* It loads `loading.html`. Then `loading.html` redirects to `http://localhost:3847`.
    *   *The Problem:* If `server.ts` is just the API/WebSocket server and DOES NOT serve the React app in dev mode, then `localhost:3847` returns a 404 or raw JSON, or nothing for the browser.
    *   **The Fix:** In Dev mode, we should redirect to the **Vite Server** (`http://localhost:5173`), NOT the backend server (`3847`), OR ensure `main.js` loads the Vite URL directly after the check.

2.  **Vite Server Availability:**
    *   `npm run electron:dev` runs `electron .`. It assumes the dev server is running.
    *   Wait, looking at `package.json`: `"electron:dev": "electron ."`.
    *   *Missing Link:* NOTHING is starting the Vite dev server! `server.ts` starts the backend. `electron .` starts the app. But who starts `vite`?
    *   **Major Bug Found:** The dev command was simplified too much. We need `concurrently` to run both the backend AND the frontend (Vite), OR we need `server.ts` to proxy to Vite.
    *   *Actually:* In the previous successful iteration, `electron:dev` was `concurrently "tsx src/server.ts" "wait-on ... && electron ."`. I removed it to fix the "port in use" bug, but I removed the Vite startup too.

## Fix Plan
1.  **Restore Vite Dev Server:** We need to run `vite` in development so that `localhost:5173` exists.
2.  **Update `loading.html`:** It should check `localhost:3847` (Backend health) but redirect to `http://localhost:5173` (Frontend UI) in dev mode.
    *   *Better approach:* `main.js` knows the URL. Let `main.js` handle the navigation. `loading.html` just waits.
    *   *Even better:* `loading.html` shouldn't be responsible for the redirect. `main.js` should wait for the *servers* to be ready, then load the real URL.

## Revised Architecture for Dev Launch
1.  **Script `dev:start`**:
    *   Run `vite` (port 5173).
    *   Run `electron .` (which spawns `server.ts` internally via `main.js`).
2.  **`main.js` Update**:
    *   It spawns `server.ts` (backend).
    *   It loads `loading.html`.
    *   It waits for `localhost:5173` (Vite) to be ready (via polling inside `main.js`, not html).
    *   Once ready, `mainWindow.loadURL('http://localhost:5173')`.

Let's implement this robust fix.

**Action Items:**
1.  **Update `package.json`**: Restore a proper dev script that runs Vite.
2.  **Update `electron/main.js`**: Change the Dev loading logic to target port 5173 (Vite) after health check.
3.  **Update `loading.html`**: Make it purely visual; let Main process control the navigation.

This explains why the user sees the loading screen (local file works) but then it dies (redirects to a backend port that doesn't serve HTML, or a closed port).

## Detailed Steps
1.  **Install `wait-on`** (if missing) or just use polling in Main.
2.  **Modify `package.json`**:
    *   `"dev": "concurrently \"npm run vite\" \"npm run electron:dev\""`? No, `main.js` spawns the server. We just need Vite.
    *   New script: `"dev": "concurrently -k \"vite\" \"electron .\""`
3.  **Modify `main.js`**:
    *   In `isDev` block:
        *   Define `VITE_URL = 'http://localhost:5173'`.
        *   Define `SERVER_URL = 'http://localhost:3847'`.
        *   Start `server.ts` (child process).
        *   Load `loading.html`.
        *   Start a polling interval in `main.js` that checks if `VITE_URL` is responsive.
        *   When responsive, `mainWindow.loadURL(VITE_URL)`.

This is the standard Electron+Vite pattern. I broke it by assuming `server.ts` served the UI in dev (it usually doesn't, Vite does).

Let's fix it.