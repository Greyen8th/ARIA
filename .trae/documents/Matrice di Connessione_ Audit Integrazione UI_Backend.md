# MATRICE DI CONNESSIONE E AUDIT INTEGRAZIONE

**Auditor:** Full-Stack Integration Specialist
**Data:** 22 Dicembre 2025

Ho analizzato i flussi di dati end-to-end. Ecco la verità su cosa è collegato e cosa è "finto".

---

### 1. IL FLUSSO CHAT (Brain Connection)
**STATO: ✅ COLLEGATO (100%)**

*   **UI:** `DynamicRouter.tsx` cattura l'input e chiama `sendMessage` del contesto.
*   **Bridge:** `AgentContext.tsx` usa un `WebSocket` diretto (`ws://localhost:3847`) verso il server. Non passa per `ipcMain`, ma è una scelta architetturale valida (React -> Express via WS).
*   **Backend:** `server.ts` (riga 244) ascolta il WebSocket, riceve il JSON `{type: 'execute'}` e lo passa a `executor.execute`.
*   **Feedback:** `executor.ts` invia aggiornamenti progressivi (`type: 'step'`) e il risultato finale (`type: 'result'`) via WS, che `AgentContext` riceve e `DynamicRouter` mostra.

### 2. IL FLUSSO VOCALE (Voice Connection)
**STATO: ⚠️ PARZIALE (Input OK, Output OK, Trigger OK)**

*   **UI (Input):** `MicButton.tsx` usa `webkitSpeechRecognition` (Browser API). Funziona localmente nel render process.
*   **Bridge:** Il testo riconosciuto viene passato direttamente alla chat (`onResult`).
*   **Output (TTS):** `server.ts` (riga 275) intercetta i tag `<voice>` e chiama `voiceEngine.speak`.
*   **Gap:** Manca un feedback visivo *durante* il parlato dell'AI. L'Orb pulsa quando *pensa*, ma non ha uno stato specifico collegato all'evento "AI sta parlando ora" (il server manda l'audio, ma non notifica l'inizio/fine al frontend via WS).

### 3. IL FLUSSO VISIONE (Eye Connection)
**STATO: ❌ SCOLLEGATO (Funzione Orfana)**

*   **Backend:** Esiste il tool `desktop_vision_capture` in `vision.ts` e l'IPC `GET_SCREENSHOT` in `main.js`.
*   **UI:** **NON ESISTE NESSUN BOTTONE** nella UI per scattare lo screenshot. L'unico modo per usarlo è chiedere in chat "Fai uno screenshot", che attiverà il tool backend.
*   **Display:** Se Aria fa lo screenshot, salva il file su disco (`aria-data/screenshots`), ma **NON LO MOSTRA** nella chat. L'utente non vede cosa Aria ha visto.

### 4. IL FLUSSO SETTINGS (Config Connection)
**STATO: ❌ FAKE (UI Orfana)**

*   **UI:** I pannelli laterali (`HUDPanels.tsx`) mostrano CPU, RAM e moduli.
*   **Backend:** Non c'è nessun flusso dati reale per queste metriche. `HUDPanels.tsx` usa `Math.random()` (riga 15) per simulare i grafici.
*   **Settings:** Non esiste proprio un menu impostazioni nella UI attuale.

---

## LISTA DEI "FILI TAGLIATI" (Backend presente, UI assente)
1.  **Vision Preview:** Il backend genera immagini, la UI non le renderizza.
2.  **System Metrics:** Il backend potrebbe leggere CPU/RAM (tramite `os` module), ma la UI inventa i numeri.
3.  **Emergency Stop:** Manca il bottone "Panic" nella UI che chiama l'API `/api/secure/lockdown`.

## LISTA DEI "BOTTONI FINTI" (UI presente, Backend scollegato)
1.  **Indicatori Moduli (HUD):** I pallini verdi "OLLAMA CORE", "VOICE ENGINE" in `StatusPanel` sono statici o fake. Non riflettono se il servizio è davvero su o giù.
2.  **Navigazione Destra:** I bottoni "Memory" e "Goals" in `App.tsx` (colonna destra) sono placeholder visivi, non navigano da nessuna parte.

---

## PIANO DI RIALLACCIAMENTO (Next Steps)

Per rendere il sistema "Onesto":

1.  **Real Metrics:** Creare un endpoint `/api/telemetry` in `server.ts` che manda CPU/RAM reali via WebSocket ogni 5s, e collegarlo a `StatusPanel`.
2.  **Vision Feedback:** Quando il tool `desktop_vision_capture` finisce, deve mandare un messaggio WS speciale `{type: 'image', url: '...'}` per mostrare lo screenshot in chat.
3.  **Attivare Navigazione:** Collegare i bottoni "Memory" e "Goals" a delle viste reali (componenti React ancora da fare o da sbloccare).

Procedo con il **Punto 1 (Real Metrics)** per dare vita ai grafici laterali?