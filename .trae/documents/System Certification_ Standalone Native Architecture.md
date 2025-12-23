# UI/UX AUTOPSY & EVOLUTION PLAN: "PROJECT GENESIS"

**Ruolo:** Senior Sci-Fi UI/UX Designer
**Analisi:** L'interfaccia attuale è un buon inizio "Cyberpunk/Terminal", ma non riflette la natura *organica* e *locale* del nuovo motore neurale. Sembra ancora troppo un "client per server remoto".

---

## 1. VISUAL CODE AUDIT (Report Attuale)
*   **Voto Estetico:** 6/10. Pulito ma statico.
*   **Palette:** `obsidian`, `cyan-bio`, `purple-trap`. Buona base sci-fi.
*   **StatusOrb:** Un cerchio che gira/pulsa. Funzionale ma "vecchia scuola" (stile HAL 9000). Non comunica *elaborazione complessa*.
*   **Layout:** A tre colonne (Status - Main - Context). Classico da dashboard admin, poco "immersivo".

## 2. GAP ANALYSIS (Sentient OS vs Chatbot)
1.  **Mancanza di Feedback Organico:** Quando il Local Cortex pensa, l'utente vede solo "THINKING". Dovrebbe vedere *l'attività neuronale*.
    *   *Soluzione:* Sostituire l'Orb statico con una **Waveform GLSL** o un **Brain Mesh 3D** (usando Three.js o Canvas 2D) che reagisce alla velocità di generazione dei token.
2.  **Telemetria Piatta:** Le barre CPU/RAM sono statiche.
    *   *Soluzione:* Grafici a linee in tempo reale (stile `recharts` o custom canvas) che mostrano i picchi di carico quando il modello "ragiona".
3.  **Tipografia:** `JetBrains Mono` va bene per i dati, ma per il chat stream serve qualcosa di più leggibile e moderno (es. `Inter` o `Rajdhani` per i titoli sci-fi).

## 3. PROPOSTA "PROJECT GENESIS UI"
### A. The "Cortex" Widget (Sostituto Status Bar)
Un componente React che visualizza lo stato del cervello locale come un "cuore pulsante".
*   **Idle:** Respirazione lenta (Colore: Cyan).
*   **Processing:** Battito accelerato + particelle (Colore: Viola).
*   **Overload:** Rosso con glitch effect (CSS clip-path animations).

### B. BrainMonitor Component (Fix Immediato)
Creerò subito questo componente per rimpiazzare la vecchia lista "Modules" in `HUDPanels.tsx`.
*   Mostrerà: Stato Modello, Utilizzo VRAM (stimato), Token/sec (se disponibile dal backend).

### C. Memory Stream (Roadmap)
Un pannello "Matrix rain" laterale che mostra i frammenti di testo recuperati dal Vector DB in tempo reale. Fa capire all'utente che Aria sta *ricordando*.

---

## PIANO DI IMPLEMENTAZIONE (Fix Immediato)
Poiché l'utente vuole un fix immediato per "Ollama Offline" e un upgrade visivo:

1.  **Nuovo Componente:** `src/frontend/components/BrainMonitor.tsx`.
    *   Design: Card traslucida con effetto "Scanline".
    *   Dati: Connesso a `metrics.brain` e `metrics.cpu`.
2.  **Integrazione:** Sostituire la lista moduli in `StatusPanel` con `BrainMonitor`.

Procedo a creare il componente `BrainMonitor` e integrarlo?