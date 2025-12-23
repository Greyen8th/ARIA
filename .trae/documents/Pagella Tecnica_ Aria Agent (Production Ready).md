# PIANO DI REDESIGN: "ARIA HUD V2"
**Role:** Senior UI/UX Engineer (Sci-Fi Specialist)

Il backend è potente, ma il frontend attuale è troppo "Web 2.0". È ora di trasformarlo in un'interfaccia operativa da film Sci-Fi.

Ecco il piano per il **"Midnight/Neon Design System"**.

---

## 1. DESIGN SYSTEM (Tailwind Config)
Aggiornerò `tailwind.config.js` per definire la nuova palette colori e le animazioni.

**Palette "Cyber-Core":**
*   `bg-obsidian`: `#050510` (Il vuoto dello spazio, più profondo del nero).
*   `cyan-bio`: `#00f3ff` (Il colore dell'intelligenza attiva).
*   `purple-trap`: `#bd00ff` (Il colore della creatività/caos).
*   `glass`: `rgba(255, 255, 255, 0.05)` (Superfici trasparenti).

**Font:** Useremo `font-mono` ovunque per quel look tecnico da terminale.

## 2. COMPONENTE "STATUS ORB" (The Soul)
Creerò `src/frontend/components/StatusOrb.tsx`.
Non sarà un semplice cerchio statico. Userò CSS animations (o Framer Motion se installato, ma CSS è più leggero) per creare stati:
*   **Idle:** Pulsazione lenta "Breathing" (Cyan).
*   **Thinking:** Rotazione veloce o "Glitch" effect (Purple).
*   **Listening:** Espansione reattiva (Red/Orange).
*   **Speaking:** Waveform simulata.

## 3. LAYOUT A 3 COLONNE (The HUD)
Riscriverò `src/frontend/App.tsx` abbandonando il layout Sidebar+Content per una griglia olografica:

| Colonna SX (20%) | Colonna Centro (50%) | Colonna DX (30%) |
| :--- | :--- | :--- |
| **SYSTEM STATUS** | **NEURAL STREAM** | **CONTEXT VISUALIZER** |
| - CPU/RAM Load | - Chat History | - File Attivi |
| - Active Tools | - Input Area | - Code Snippets |
| - Network | - Mic Waveform | - "Thought Process" |

## 4. INTEGRAZIONE
1.  **Aggiornare `tailwind.config.js`** con i colori personalizzati.
2.  **Creare `StatusOrb.tsx`** come cuore visivo.
3.  **Rifare `App.tsx`** implementando la griglia e spostando la logica di `DynamicRouter` nella colonna centrale.
4.  **Aggiungere `StatusPanel.tsx`** (SX) e `ContextPanel.tsx` (DX) come placeholder intelligenti.

---

### Piano Operativo
1.  Modificare `tailwind.config.js`.
2.  Creare i componenti UI (`StatusOrb`, `StatusPanel`, `ContextPanel`).
3.  Riscrivere `App.tsx` per assemblare il nuovo HUD.

Procedo con il redesign?