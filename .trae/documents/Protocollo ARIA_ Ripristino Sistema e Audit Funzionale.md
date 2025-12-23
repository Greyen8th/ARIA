# Protocollo ARIA: Ripristino Sistema e Audit Funzionale

## 1. Diagnosi Critica: "Schermata Nera" in Produzione
L'analisi ha confermato che il problema della "schermata nera" nel file DMG installato è causato dal metodo di avvio del server backend (`server.ts`).
- **Causa:** Il file `main.js` tenta di eseguire `tsx src/server.ts`. `tsx` è uno strumento di sviluppo e non funziona correttamente all'interno dell'applicazione pacchettizzata (DMG), poiché i file sorgente `src` non sono accessibili allo stesso modo e l'interprete TypeScript non è ottimizzato per la produzione.
- **Soluzione:** È necessario compilare il server (`src/server.ts`) in un singolo file JavaScript ottimizzato (`dist/server-bundle.js`) e istruire Electron ad eseguire quel file in produzione.

## 2. Audit Capacità "Jarvis" e Integrazione
- **Self-Rewrite (UI):** L'agente possiede la logica per modificare i propri file (`evolution.ts`). Tuttavia, per le modifiche all'interfaccia (React), è necessario un **ciclo di ricompilazione**. L'agente può modificare il codice, ma vedrai i cambiamenti solo dopo un riavvio che include una build (gestito dal tool `system_rebuild_and_restart`).
- **Controllo Mouse:** La libreria `robotjs` è presente. Poiché è un modulo nativo (C++), potrebbe causare problemi se non compilata specificamente per la versione di Electron in uso. Aggiungerò controlli per garantire che venga inclusa correttamente.
- **Apprendimento Rete:** L'agente ha accesso alla shell e a internet (via axios/fetch). Può "imparare" eseguendo scansioni o ricerche, ma non ha un "sniffer" passivo attivo di default (per sicurezza).

## 3. Piano di Intervento (Step-by-Step)

### A. Correzione Architetturale (Fix Schermata Nera)
1.  **Installazione Builder:** Installerò `esbuild` per creare un bundle leggero del server.
2.  **Script di Compilazione:** Creerò uno script `scripts/bundle-server.js` per convertire tutto il backend TypeScript in un unico file JavaScript eseguibile.
3.  **Update Entrypoint:** Modificherò `electron/main.js` per distinguere tra:
    - *Dev:* Usa `tsx` (come ora).
    - *Prod:* Usa `node` per eseguire il nuovo `server-bundle.js`.

### B. Audit e Hardening
1.  **Verifica Native Modules:** Controllerò che `robotjs` sia compatibile con la build macOS.
2.  **Verifica Loop Evolutivo:** Confermerò che il comando di self-update inneschi correttamente la ricostruzione.

### C. Rilascio v1.1.1
1.  Aggiornamento versione a `1.1.1`.
2.  Pulizia build vecchie.
3.  Generazione nuovo DMG ottimizzato.

**Sei pronto per procedere con queste correzioni strutturali?**