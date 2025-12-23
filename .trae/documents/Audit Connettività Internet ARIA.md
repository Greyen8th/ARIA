# Piano Finale: ARIA "Ghost in the Shell" (Automazione Totale)

Hai richiesto che ARIA non abbia solo "tool" separati, ma che queste capacità siano **integrate nella sua intelligenza** per renderla autonoma.

### Il Concetto: "Embodied AI" (AI con un Corpo)
Non aggiungerò solo comandi. Trasformerò ARIA in un'agente che "vede" e "tocca" il sistema operativo come farebbe un umano.

### 1. Architettura "Vision & Action"
*   **Occhi (Vision)**: Integrerò la capacità di fare screenshot periodici o su richiesta e analizzarli (usando OCR leggero o visione simulata se il modello locale lo supporta, altrimenti analisi strutturale UI via AppleScript/Accessibility API).
*   **Mani (Action)**: Userò `@nut-tree/nut-js` per dare ad ARIA il controllo fisico di mouse e tastiera.
*   **Cervello (Integration)**: Modificherò il `systemPrompt` in `prompt-manager.ts`. ARIA non saprà solo di "avere dei tool", ma le verrà insegnato che **LEI È IL MAC**.
    *   *Esempio*: Invece di dire "Uso il tool browser", penserà "Muovo il mouse sull'icona Safari, clicco, aspetto che si apra, digito l'URL".

### 2. Implementazione Tecnica Rafforzata
1.  **Dipendenze**: `puppeteer` (Browser), `@nut-tree/nut-js` (Input), `jimp` (Immagini).
2.  **Modulo `src/tools/os-automation.ts`**:
    *   `human_mouse_move`: Movimento non istantaneo ma fluido (curva di Bezier) per sembrare umano ed evitare rilevamenti anti-bot.
    *   `visual_find_and_click`: "Trova l'immagine di questo bottone sullo schermo e cliccaci".
    *   `smart_browser`: Navigazione Puppeteer persistente (non chiude il browser dopo ogni comando, mantiene la sessione).
3.  **Integrazione Prompt**: Aggiornamento delle istruzioni di base per spiegare ad ARIA come coordinare "Vedere -> Pensare -> Agire".

### 3. Sicurezza & Permessi
*   Poiché ARIA agirà come un "utente fantasma", implementerò un **Freno di Emergenza**: Se muovi il mouse violentemente (shake), ARIA smette immediatamente di controllare l'input (Safety Kill Switch).

### 4. Risultato Atteso
Potrai dire: *"ARIA, apri Spotify, cerca una playlist jazz e mettila in riproduzione."*
ARIA eseguirà:
1.  `cmd+space` (Spotlight)
2.  Scrive "Spotify" + Enter
3.  Aspetta (Visione: controlla se la finestra è aperta)
4.  Clicca sulla barra di ricerca
5.  Scrive "Jazz"
6.  Clicca "Play"

Procedo con questa trasformazione in agente autonomo completo.