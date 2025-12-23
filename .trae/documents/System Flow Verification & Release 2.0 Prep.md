# REPORT FLUSSO 2.0: ARIA NERVE CHECK

**Analisi del Flusso (Nerve Check):**
1.  **UI Input:** `ChatInterface` invia messaggi via `AgentContext.tsx` -> WebSocket (`ws://localhost:3847`). **OK.**
2.  **Server:** `server.ts` riceve il messaggio WebSocket `{ type: 'execute', task: '...' }` e chiama `executor.execute(task)`. **OK.**
3.  **Brain Connection:** `executor.ts` chiama `provider.chat()` (che ora è `LocalCortex`). **OK.**
4.  **Action Parser (LE MANI):** `executor.ts` riga 257 ha un metodo `parseAction` che cerca blocchi JSON nel formato:
    ```json
    { "action": { "tool": "...", "params": {...} } }
    ```
    Se l'LLM risponde con questo JSON, `executor` esegue il tool corrispondente (`tool.execute(params)`). **OK.**
5.  **System Prompt:** `prompt-manager.ts` (chiamato in `executor.ts`) inietta un prompt molto dettagliato (`ARIA_BRAIN`) che forza l'LLM a rispondere in JSON per usare i tool. **OK.**

**Vulnerabilità Rilevata:**
Il `LocalCortex` (Qwen 3B) deve essere *molto* bravo a rispettare il formato JSON. Se risponde con testo libero quando dovrebbe usare un tool, l'azione fallisce (il parser restituisce `null` e l'executor tratta la risposta come testo semplice).
*Fix:* Il System Prompt è robusto, ma Qwen 3B potrebbe essere testardo. Per ora ci fidiamo del prompt.

**Stato Sistema:** **VERDE**. Il cablaggio è completo. Le "mani" sono collegate al "cervello".

---

## CHECK LIST PRE-BUILD 2.0 (Esecuzione Immediata)

Poiché il flusso è confermato, procedo direttamente a preparare la release finale.

1.  **Version Bump:** Aggiornare `package.json` a `2.0.0`.
2.  **Final Cleanup:** Rimuovere log di debug residui in `AgentContext.tsx` o `server.ts` se necessario (ma sembrano puliti).
3.  **Build Command:** `npm run dist:mac` è il comando confermato.

**Piano Operativo:**
1.  Modificare `package.json` (Version 2.0.0).
2.  Aggiornare `server.ts` per stampare "ARIA 2.0 SERVER" all'avvio.
3.  Confermare all'utente che può lanciare la build.

Procedo con il bump di versione?