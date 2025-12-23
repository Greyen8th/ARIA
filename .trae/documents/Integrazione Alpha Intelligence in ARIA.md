Ecco il piano dettagliato per integrare il modulo "Alpha Intelligence" in ARIA, trasformando il codice proposto in una suite di tool reali, sicuri e persistenti.

### 1. Creazione del Modulo Alpha Intelligence (`src/tools/alpha.ts`)
Implementerò una classe `AlphaIntelligence` che incapsula la logica delle 6 fasi (Recon, Hunt, Scan, Fix, Test, Evolve) e la esporrò come un set di tool ARIA.

*   **Tool: `alpha_recon`**: Esegue scansioni passive su un target (IP, DNS, Tech Stack) usando API pubbliche gratuite.
*   **Tool: `alpha_api_hunt`**: Cerca attivamente API gratuite online correlate a una keyword e le salva nel database di ARIA.
*   **Tool: `alpha_security_scan`**: Esegue test di sicurezza etici (Header, Directory Brute-force leggero, controllo porte comuni) su target autorizzati.
*   **Tool: `alpha_evolve_loop`**: Esegue il ciclo completo "Recon -> Scan -> Fix -> Test" in autonomia su un progetto o URL target.

### 2. Integrazione nel Core di ARIA
*   Aggiornamento di `src/tools/index.ts` per includere `alphaTools`.
*   Collegamento dello stato persistente di Alpha (`alpha-state.json`) alla cartella dati di ARIA (`./aria-data/alpha-memory.json`) per mantenere la "memoria" delle evoluzioni tra i riavvii.

### 3. Potenziamento del Server e UI
*   Non sono richieste modifiche alla UI (la nuova UI Cyberpunk gestirà automaticamente i nuovi tool visualizzandone i log di esecuzione).
*   Il sistema "Zero-Cost" già implementato supporterà le chiamate API di Alpha (usando `fetch` e fallback gratuiti).

### 4. Sicurezza e Etica
*   Aggiungerò un controllo esplicito: i tool di scansione attiva (`alpha_security_scan`) richiederanno conferma o funzioneranno solo su `localhost`, domini di test (es. `example.com`, `httpbin.org`) o domini esplicitamente whitelistati dall'utente, per evitare usi impropri accidentali.

### 5. Installazione Dipendenze
*   Aggiunta di `axios` (se non presente, useremo `fetch` nativo per leggerezza) e `cheerio` (per un parsing HTML leggero durante l'API Hunt) se necessari, ma cercherò di usare solo `fetch` standard per mantenere il progetto leggero.

Procederò immediatamente con la creazione di `src/tools/alpha.ts` e l'aggiornamento degli indici.