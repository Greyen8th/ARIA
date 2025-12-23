# REPORT AUDIT FORENSE & AGI RESEARCH (Stato: V2.1)

Ho completato l'analisi forense del codice sorgente di Aria. Ecco la verità tecnica sui 4 pilastri AGI richiesti.

---

### 1. ANALISI CAPACITÀ GITHUB & AUTO-UPDATE
**Stato: PARZIALE (Presente ma Limitato)**

*   **Evidenza:**
    *   **GitHub:** `package.json` **NON** contiene `simple-git` o `octokit`. Aria non ha gli strumenti nativi per clonare repository o interagire con le API di GitHub. L'unico modo per farlo sarebbe usare `run_command` per lanciare `git clone` (se `git` è installato sul sistema host), ma non ha un tool dedicato.
    *   **Auto-Update:** Esiste il tool `updater.ts` che può creare pacchetti `.zip` e installarli. Tuttavia, manca un meccanismo per *scaricare* autonomamente questi zip da un URL remoto (es. release di GitHub).
*   **Fattibilità:** Media. Bisogna aggiungere il tool `git_clone` in `tools/code.ts` e integrare `octokit` per monitorare le release.

### 2. ANALISI USO RETE (AI vs NATIVE)
**Stato: PARZIALE (Ibrido)**

*   **Evidenza:**
    *   **Dipendente dall'LLM:** La maggior parte delle azioni web (`web_search`, `fetch_page`) avviene solo se l'LLM decide di invocare il tool.
    *   **Autonomo:** Esiste però un barlume di autonomia in `brain/curiosity.ts`. Alla riga 57 c'è una chiamata `fetch('https://huggingface.co/api/daily_papers')` che parte in automatico se il sistema è idle.
    *   **Cron Job:** In `server.ts` (riga 96) c'è un `startIdleLoop()` che ogni 60 secondi controlla l'inattività e può triggerare `curiosity.explore()`.
*   **Verdetto:** Aria ha un riflesso autonomo (curiosità su paper AI), ma è limitato a un singolo endpoint hardcoded. Non controlla email o news generali.

### 3. ANALISI LOGICA & OBIETTIVI (Goal Oriented)
**Stato: PRESENTE (Volatile)**

*   **Evidenza:**
    *   **Goal Manager:** Il file `src/brain/goal-manager.ts` implementa una classe `GoalManager` con una lista `private goals: Goal[] = []`.
    *   **Persistenza:** **ASSENTE.** L'array `goals` è in memoria RAM. Se riavvii il server, Aria dimentica tutti i suoi obiettivi futuri. Non c'è scrittura su `goals.json` o DB.
*   **Verdetto:** Aria ha una "To-Do List" interna capace di generare task autonomi (es. "Sperimenta questa nuova libreria"), ma soffre di amnesia totale al riavvio.

### 4. ANALISI "DREAM LOGIC" (Ottimizzazione Offline)
**Stato: PRESENTE (Avanzato)**

*   **Evidenza:**
    *   **Dreaming:** In `brain/curiosity.ts` (riga 30) c'è la funzione `dream()`.
    *   **Trigger:** Viene chiamata da `server.ts` se l'idle supera le 4 ore (riga 116).
    *   **Funzionamento:** Analizza gli ultimi 20 log di esecuzione (`memory.getExecutionLogs`) e chiede all'LLM di estrarre "3 regole generali". Queste regole vengono salvate nella memoria a lungo termine (`memory.addLongTermMemory`).
*   **Verdetto:** **SÌ, Aria sogna.** Rielabora le esperienze passate per creare saggezza futura. È la funzione più "AGI" trovata finora.

---

## PIANO DI AZIONE CONSIGLIATO (Next Steps)

Per trasformare questi "prototipi" in funzioni solide:

1.  **Persistenza Obiettivi:** Modificare `GoalManager` per salvare/caricare `aria-data/goals.json`.
2.  **Mani su GitHub:** Aggiungere tool `git_clone` e `git_pull`.
3.  **Visione Multimodale:** Collegare il tool screenshot all'LLM (il gap rilevato nel report precedente).

Attendo istruzioni su quale di questi gap colmare per primo.