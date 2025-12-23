# UI Fabricator Audit & Plan

## FASE 1: AUDIT DI FATTIBILITÀ (Esito: ⚠️ WARNING)

Ho analizzato la struttura dei file e c'è un problema fondamentale: **Non esiste il codice sorgente del Frontend (React).**

1.  **Analisi File:**
    *   Vedo `dist/`, `build/`, `electron/`, `src/` (che contiene solo codice backend/agent TypeScript: `server.ts`, `agent/`, `tools/`).
    *   **Mancano:** `src/App.tsx`, `src/components/`, `vite.config.ts`, `index.html` (quello sorgente, non quello in `public/`).
    *   Sembra che il progetto sia configurato per servire un frontend pre-compilato (probabilmente in `public/assets/`) o che manchi del tutto la parte React nel repo corrente. Il file `package.json` ha script per `vite` ma non vedo i file sorgente di React.

2.  **Conclusione Audit:**
    *   Non possiamo usare HMR o React Router dinamico se non abbiamo il codice sorgente React (`.tsx`).
    *   Attualmente, `src/server.ts` serve file statici da `../public`.
    *   **Azione Necessaria:** Dobbiamo prima creare l'infrastruttura Frontend React da zero (o ripristinarla) dentro `src/frontend` o simile, prima di poter creare un "UI Fabricator".

## FASE 2: PIANO DI RI-ARCHITETTURA (Per Abilitare l'UI Fabricator)

Poiché non posso modificare un frontend compilato, devo creare una struttura frontend modificabile.

1.  **Creazione Struttura Frontend (`src/ui`):**
    *   Creerò `src/ui/App.tsx`, `src/ui/main.tsx`, `src/ui/index.css`.
    *   Installerò React e Vite (se non già configurati correttamente per il dev mode).

2.  **Tool `ui-fabricator.ts`:**
    *   Questo tool scriverà file dentro `src/ui/components/generated/`.
    *   Ma perché funzioni, il server di sviluppo deve essere in ascolto su quei file.

## FASE 3: PIANO ALTERNATIVO (HTML/JS Dinamico - "Low Code")

Se non vogliamo ristrutturare tutto il progetto per React, possiamo usare un approccio più semplice e robusto per un agente autonomo: **HTML/JS Injection.**
Tuttavia, la richiesta è specifica per **React/Vite**. Quindi procederò a creare l'infrastruttura minima React.

## ROADMAP DI ESECUZIONE

1.  **Setup Frontend:** Creare la cartella `src/frontend` con un'app React base.
2.  **Configurazione Vite:** Creare `vite.config.ts` per servire questo frontend.
3.  **Implementazione `ui-fabricator.ts`:** Il tool che scrive componenti `.tsx` in `src/frontend/components/generated`.
4.  **Dynamic Router:** Creare un `DynamicComponentLoader` in React che legge una lista di componenti (JSON) e li renderizza, permettendo all'AI di "iniettare" viste senza ricompilare tutto il router.

**Confermi di voler procedere con la creazione della struttura sorgente React in `src/frontend`?** (Senza di questa, non posso esaudire la richiesta di modificare l'UI autonomamente).
