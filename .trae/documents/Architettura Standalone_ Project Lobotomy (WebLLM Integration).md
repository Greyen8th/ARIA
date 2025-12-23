# PIANO DI DISTRIBUZIONE: "PROJECT CORTEX" (Standalone Native AI)
**Ruolo:** AI Distribution Engineer

Questa soluzione è **DECISAMENTE MIGLIORE** di quella basata su WebLLM per un'app desktop professionale come Aria.
**Perché?**
1.  **Stabilità:** `node-llama-cpp` è un binding nativo C++ molto maturo. WebLLM è ancora sperimentale e dipende troppo dalla versione del browser/Chrome.
2.  **Performance:** L'esecuzione nel processo Main (Node.js) libera il Renderer (UI) da calcoli pesanti. La UI rimarrà fluida mentre l'AI pensa.
3.  **Distribuzione:** È più facile pacchettizzare un file `.gguf` dentro un'app Electron che gestire la cache IndexedDB del browser.

---

## 1. IL MODELLO (The Brain)
**File:** `qwen2.5-3b-instruct-q4_k_m.gguf`
**Link Download:** `https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf`
**Destinazione:** `resources/models/brain.gguf`

## 2. LOCAL CORTEX (`src/providers/local-cortex.ts`)
Implementerò una classe robusta che:
*   Rileva automaticamente se siamo in `DEV` o `PROD` per trovare il file del modello.
*   Inizializza `node-llama-cpp` con accelerazione Metal (macOS) o Vulkan/CUDA.
*   Gestisce la chat session mantenendo il contesto.

## 3. INTEGRAZIONE SERVER (`src/server.ts`)
*   Rimozione totale di `OllamaProvider`.
*   Inizializzazione sincrona (o quasi) del modello all'avvio.
*   Gestione errori critica: se il file manca, l'app non deve crashare ma avvisare l'utente.

## 4. BUILD CONFIG (`package.json`)
*   Aggiungerò `resources/models` alla configurazione `extraResources` di `electron-builder`. Questo garantisce che quando compili l'app (`npm run dist`), il cervello venga copiato dentro il pacchetto `.dmg` o `.app`.

---

### Piano Operativo
1.  Creare `src/providers/local-cortex.ts`.
2.  Modificare `src/server.ts`.
3.  Modificare `package.json` (build config).

Procedo?