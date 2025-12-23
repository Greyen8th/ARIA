# PIANO DI IMPLEMENTAZIONE: "THE FROZEN UI" PATCH

Hai identificato correttamente il problema: **Electron non carica file fuori dall'ASAR** in modo nativo.
Dobbiamo creare un ponte sicuro tra il Main Process (che ha accesso al filesystem) e il Renderer Process (React).

Ecco il piano per implementare la patch che hai richiesto:

## 1. BACKEND (Electron Main Process)
**File:** `electron/main.js`
**Obiettivo:** Aggiungere un handler IPC `READ_EXTERNAL_FILE` che legge i file dalla cartella "Live Layer" (`Application Support/Aria/live-layer/`).
**Sicurezza:** Deve impedire il Path Traversal (non caricare `/etc/passwd`).

## 2. BRIDGE (Preload Script)
**File:** `electron/preload.js`
**Obiettivo:** Esporre la funzione `readExternalComponent` al mondo React tramite `window.electronAPI`.

## 3. FRONTEND (Dynamic Loader)
**File:** `src/utils/DynamicLoader.ts` (Nuovo File)
**Obiettivo:** Implementare la logica che hai fornito:
1.  Richiedere il contenuto del file via IPC.
2.  Usare `new Function` per trasformare la stringa in un componente React eseguibile.
3.  Iniettare `React` come dipendenza.

## 4. INTEGRAZIONE (Dynamic Router)
**File:** `src/frontend/DynamicRouter.tsx`
**Obiettivo:** Modificare la logica di caricamento:
*   *Prima:* Cerca in `src/components/generated` (Vite glob).
*   *Dopo:* Cerca PRIMA via `DynamicLoader` (Live Layer). Se fallisce, usa il bundle interno.

---

### Step Operativi
1.  Modificare `electron/main.js` per aggiungere `ipcMain.handle('READ_EXTERNAL_FILE', ...)`
2.  Modificare `electron/preload.js` per esporre la funzione.
3.  Creare `src/utils/DynamicLoader.ts` con il codice che hai fornito.
4.  Aggiornare `src/frontend/DynamicRouter.tsx` per usare il loader ibrido.

Procedo?