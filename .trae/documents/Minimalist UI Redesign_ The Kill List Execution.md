# UI DESIGN PLAN: "THE INVISIBLE INTELLIGENCE"

**Filosofia:** Dieter Rams meets Blade Runner. Less but better.
**Obiettivo:** Rimuovere il rumore tecnico per rivelare l'intelligenza organica.

---

## 1. LA "KILL LIST" (Elementi da Eliminare)
Ho analizzato i file. Ecco cosa deve sparire per sempre:

*   **`Header.tsx`**:
    *   Sottotitolo "Neural System" -> Ridondante.
    *   Logo complesso con cerchi -> Sostituire con semplice testo "ARIA" o icona minimal.
*   **`HUDPanels.tsx`**:
    *   **ContextPanel:** Il blocco di testo `<pre>` con log finti (`Initializing cognitive loop...`) -> **VIA**. Fa molto "film anni 90".
    *   **StatusPanel:** Le barre CPU/RAM giganti -> **VIA**. L'utente non è un sistemista.
    *   **Artifacts:** "No active artifacts" -> Nascondere se vuoto.
*   **`BrainMonitor.tsx`**:
    *   Griglia metriche (System Load, Inference Type) -> Troppo tecnico.
    *   Lasciare solo il "Cuore Pulsante" (l'Orbita) ma renderlo più elegante e meno "videogioco".

## 2. NUOVO CONCEPT: "ORGANIC MINIMALISM"

### A. The Ethereal Header
*   Solo il nome "ARIA" (font tracking largo) a sinistra.
*   Solo il toggle lingua (EN/IT) a destra, minimalissimo (solo testo, niente pillole colorate).
*   Sfondo completamente trasparente con blur (`backdrop-filter: blur(20px)`), niente bordi.

### B. The Living Sidebar (Ex StatusPanel)
*   Sostituire barre e grafici con un'unica **"Life Line"**: una linea sottile che pulsa lentamente (respiro) quando idle, e vibra (waveform) quando pensa.
*   Nessun numero. Solo feedback visivo subconscio.

### C. The Focus Area (Chat)
*   Tutto lo spazio centrale dedicato alla conversazione.
*   Input bar flottante in basso, staccata dal bordo (stile Spotlight/Alfred).

---

## PIANO DI AZIONE (Cleanup Immediato)

Per rispettare la richiesta di "pulizia" senza rifare l'intera app da zero ora:

1.  **Header:** Semplificare. Via loghi complessi e bordi pesanti.
2.  **HUDPanels:**
    *   Commentare via `StatusPanel` (CPU/RAM).
    *   Commentare via `ContextPanel` (Log finti).
    *   Mantenere solo `BrainMonitor` ma in versione "Lite" (solo l'animazione centrale).
3.  **App.tsx:** Rimuovere le colonne laterali pesanti se non contengono info vitali, o renderle collassabili/invisibili.

**Proposta concreta per ora:**
Trasformare le colonne laterali in "fantasmi": visibili solo al mouse hover o ridotte al minimo (solo icone).
Per ora, **rimuoverò il rumore** dai pannelli esistenti.

Procedo a "uccidere" i log e le barre di progresso?