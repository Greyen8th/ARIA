# AUDIT & REPAIR: ARIA STANDALONE

Ho eseguito l'audit richiesto. Il sistema "Local Cortex" è solido, ma ho trovato un problema critico nel sistema di memoria che romperebbe l'evoluzione senza Internet/Ollama.

### 1. IL PROBLEMA MEMORIA (VectorStore)
*   **Diagnosi:** `src/memory/vector-store.ts` (riga 33) fa ancora una chiamata HTTP a `localhost:11434/api/embeddings` (Ollama) per generare i vettori della memoria.
*   **Conseguenza:** Se Ollama non c'è, Aria non può creare nuovi ricordi (fallback su vettore di zeri). L'evoluzione si blocca.
*   **Soluzione:** `node-llama-cpp` (il motore che abbiamo appena installato) supporta la generazione di embeddings direttamente dal file `.gguf` che hai scaricato!
*   **Fix:** Modificare `VectorStore` per accettare l'istanza di `LocalCortex` e usare il suo motore interno per gli embeddings.

### 2. COMPATIBILITÀ LOGICA (Advanced Logic)
*   **Goal Manager & Curiosity:** Hanno bisogno del metodo `generate()`. L'ho già pianificato e confermo che è necessario.
*   **Connessione:** Una volta fixato `LocalCortex.generate()`, questi moduli funzioneranno con il cervello locale.

### 3. VERDETTO FINALE
Se applichiamo questi fix, Aria sarà **100% Standalone**.
Potrà imparare, evolvere e ragionare usando solo il file `brain.gguf` e la tua GPU.

---

## PIANO DI INTERVENTO (Fix Finale)

1.  **LocalCortex Upgrade:**
    *   Aggiungere metodo `generate(prompt)`.
    *   Aggiungere metodo `embed(text)` che usa `LlamaContext.getEmbedding()`.

2.  **VectorStore Repair:**
    *   Rimuovere `fetch` verso Ollama.
    *   Usare `localCortex.embed(text)` per generare vettori.

3.  **Dependency Injection:**
    *   Passare `localCortex` al costruttore di `Memory` e `VectorStore` in `server.ts`.

Procedo a rendere la memoria autonoma?