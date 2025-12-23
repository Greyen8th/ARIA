# Piano di Debugging e Risoluzione "Schermata Nera" Electron

Il problema della schermata nera in Electron con Vite è quasi sempre dovuto a percorsi di caricamento errati (`loadURL` vs `loadFile`) o alla configurazione del `base path` in Vite.

### Analisi Attuale
Ho già letto i file critici (`vite.config.ts`, `package.json`, `electron/main.js`) e ho individuato potenziali cause:

1.  **Vite Config (`vite.config.ts`)**:
    *   Attuale: `outDir: path.resolve(__dirname, 'aria-agent/public')`
    *   Problema: Manca `base: './'`. In Electron, se non si specifica `base: './'`, Vite genera percorsi assoluti (es. `/assets/index.js`) che falliscono quando il file HTML viene aperto localmente (`file://...`).

2.  **Electron Main (`electron/main.js`)**:
    *   Attuale: Carica `SERVER_URL` (`http://localhost:3847`) in dev, ma in produzione non è chiaro se carica correttamente il file locale o cerca ancora il server.
    *   Problema: Se il server Express non parte (es. errore porta occupata) o se `isDev` è false ma il server non è pronto, Electron carica una pagina bianca. Inoltre, in produzione, è molto meglio caricare il file statico (`loadFile`) generato da Vite piuttosto che dipendere da un server locale per la UI.

### Piano di Risoluzione

1.  **Fix `vite.config.ts`**:
    *   Imposterò `base: './'` per garantire che i path degli asset siano relativi.
    *   Modificherò l'output directory per essere coerente (es. `dist` o `aria-agent/dist`).

2.  **Fix `electron/main.js`**:
    *   Implementerò una logica robusta per il caricamento:
        *   **DEV**: `loadURL('http://localhost:3847')` (come ora).
        *   **PROD**: `loadFile(path.join(__dirname, '../dist/index.html'))`.
    *   Attiverò `mainWindow.webContents.openDevTools()` di default per vedere gli errori in console se il problema persiste.

3.  **Fix `package.json`**:
    *   Verificherò che lo script di build punti alla cartella corretta.

4.  **Rebuild**:
    *   Eseguirò `npm run build` e poi rilancerò l'app per verificare.

Questo risolverà il problema alla radice eliminando la dipendenza dal server locale per la UI statica in produzione e correggendo i percorsi dei file.