# PIANO DI RISOLUZIONE: SCHERMATA NERA

**Diagnosi:**
La schermata nera indica che Electron non riesce a caricare i file HTML/JS corretti.
1.  **Errore Percorso `vite.svg`:** Nel file `src/frontend/index.html`, il link `<link rel="icon" ... href="/vite.svg" />` usa un percorso assoluto `/`. In un'app Electron packaged, questo non funziona perché non c'è un web server alla radice.
2.  **Configurazione `base` Mancante:** `vite.config.ts` non definisce `base: './'`. Di default Vite assume percorsi assoluti (`/assets/script.js`), che falliscono quando il file viene caricato via `file://`.
3.  **Loading in Electron:** `main.js` carica `indexPath` correttamente, ma se gli asset dentro `index.html` hanno percorsi errati, la pagina resta bianca o si blocca.

**Soluzione Proposta:**
1.  **Configurare Vite:** Aggiungere `base: './'` in `vite.config.ts` per forzare percorsi relativi negli asset compilati.
2.  **Correggere `index.html`:** Rimuovere o correggere il riferimento a `/vite.svg` (renderlo relativo o rimuoverlo se inutile).
3.  **Ricompilare:** Eseguire nuovamente la build completa.

**Passaggi:**
1.  Modificare `vite.config.ts` -> Aggiungere `base: './'`.
2.  Modificare `src/frontend/index.html` -> Cambiare `href="/vite.svg"` in `href="./vite.svg"` (o rimuovere).
3.  Eseguire `npm run dist:mac`.

Procedo?