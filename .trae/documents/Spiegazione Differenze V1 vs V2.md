# PIANO DI RILASCIO: UPDATE MANAGER & LIVE CONSOLIDATION
**Role:** DevOps Architect // Release Engineer

Hai perfettamente ragione. Per aggirare il "Code Signing" di macOS e mantenere la persistenza, dobbiamo separare nettamente il **Core (Firmato/Immutabile)** dallo **Userland (Modificabile/Live)**.

Ecco l'architettura del modulo "Update Manager" che risponde alle tue specifiche.

## 1. L'ARCHITETTURA "OVERLAY" (Dev vs Stable)

Immagina il filesystem come due layer sovrapposti:

1.  **Layer 0 (Core/Stable):** La cartella dell'app (`/Applications/Aria.app/...`). **READ-ONLY**.
2.  **Layer 1 (Live/Dev):** `~/Library/Application Support/Aria/live-layer/`. **READ-WRITE**.

Quando Aria "evolve", scrive *solo* nel Layer 1.
Il sistema di caricamento (Server & UI) cercherà sempre prima nel Layer 1. Se non trova il file, usa quello del Layer 0.

## 2. IL FLUSSO "CONSOLIDATE"

Quando l'utente preme "Consolida Modifiche", avviene la magia del DevOps locale:

1.  **Snapshot:** Aria scansiona il `Layer 1` (tutti i componenti/script custom creati).
2.  **Packaging:** Crea un archivio `update-v{timestamp}.zip` contenente solo le differenze.
3.  **Promotion (Strategia):**
    *   **In Dev (Localhost):** Copia brutalmente i file dal Layer 1 al Layer 0 (`src/`) e committa (se git è attivo).
    *   **In Prod (Distributed):** Salva lo ZIP e genera un JSON `manifest.json`. L'utente può inviare questo ZIP ad altri, che lo caricheranno come "Patch Ufficiale".

## 3. IMPLEMENTAZIONE TECNICA

### A. Il Modulo `tools/updater.ts`
Creerò questo tool che espone due funzioni critiche:
*   `create_update_package`: Zippa le modifiche live.
*   `apply_update_package`: Installa uno zip esterno.

### B. Gestione Conflitti (The Priority Rule)
La logica di caricamento seguirà rigorosamente questa gerarchia:
`User Custom (Layer 1) > Official Update (Layer 0) > Factory Default`

Se scarichi un update ufficiale che tocca `Login.tsx`, ma tu hai una versione custom in Layer 1, **vince la tua**. Aria ti avviserà: *"Update disponibile ma mascherato dalla tua versione custom"*.

## 4. CODICE PROPOSTO: `tools/updater.ts`

```typescript
// Pseudocodice della logica che implementerò
export const updaterTools = [{
    name: 'consolidate_version',
    execute: async ({ versionLabel }) => {
        // 1. Definisci percorsi
        const liveDir = path.join(appData, 'live-layer');
        const outputZip = path.join(appData, 'releases', `update-${versionLabel}.zip`);
        
        // 2. Verifica se c'è qualcosa da consolidare
        if (isEmpty(liveDir)) return "Nessuna modifica pendente.";

        // 3. Crea il pacchetto
        await zipDirectory(liveDir, outputZip);
        
        // 4. (Opzionale) Promote to Source se siamo in Dev
        if (process.env.NODE_ENV === 'development') {
            await copyDir(liveDir, 'src/'); // Merge fisico
            return `Dev Mode: Modifiche unite al source code E pacchettizzate in ${outputZip}`;
        }

        return `Release creata: ${outputZip}. Condividi questo file per distribuire la tua versione.`;
    }
}];
```

## VERDETTO FINALE
Questa architettura trasforma Aria da semplice "App" a "Piattaforma".
- **Sicurezza:** Non rompiamo mai la firma dell'app principale (Layer 0).
- **Flessibilità:** L'utente può sperimentare nel Layer 1 senza paura (basta cancellare la cartella per resettare).
- **Viralità:** Gli utenti possono scambiarsi i file `.zip` delle loro "Aria Evolved".

**Procedo a creare `src/tools/updater.ts` e aggiornare la logica di `evolution.ts` per usare questo nuovo path?**