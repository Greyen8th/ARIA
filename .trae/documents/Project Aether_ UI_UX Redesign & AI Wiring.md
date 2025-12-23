# PIANO DI RIFONDAZIONE: PROJECT AETHER

**Diagnosi Critica:**
L'interfaccia attuale soffre di "Over-Engineering Visivo". Troppe colonne, troppi riquadri, e una dipendenza da CSS che sembra essersi rotta nella build (da qui la schermata nera/testo sovrapposto).
Il codice Tailwind è corretto, ma l'architettura a 3 colonne è fragile e non rispecchia l'obiettivo "Invisible Tech".

**Soluzione: Design "Aether" (Minimalismo Radicale)**
Distruggeremo il layout a griglia per passare a un layout "Void-Centric" (centrato sul vuoto).

**1. Nuova Architettura UI (`App.tsx`)**
*   **Sfondo:** Nero Assoluto (`#000000`) con una singola, impercettibile luce ambientale (Radial Gradient) che segue lo stato dell'AI.
*   **Elemento Centrale:** Non più una dashboard, ma un **"Core Pulsante"** (Sfera/Luce) che vive al centro dello schermo.
*   **Input:** Una "Barra di Comando" fluttuante in basso, vetro smerigliato (Glassmorphism), staccata dai bordi. Stile Braun/Apple.
*   **Output:** I messaggi non sono in una "scatola". Fluttuano nel vuoto sopra la barra di input.

**2. Componenti Nuovi**
*   `src/frontend/components/Aether/Core.tsx`: L'entità visiva dell'AI. Reagisce a `status` (Idle = Respiro lento, Thinking = Accelerazione, Speaking = Modulazione).
*   `src/frontend/components/Aether/CommandBar.tsx`: Input minimalista. Nessun bottone "Invia" ingombrante. Solo testo e cursore.
*   `src/frontend/components/Aether/Stream.tsx`: Flusso di messaggi effimero.

**3. Cablaggio AI (`AgentContext`)**
*   Confermato che la logica WebSocket è sana.
*   Collegheremo il nuovo `CommandBar` direttamente a `sendMessage`.
*   Aggiungeremo un feedback aptico visivo: quando invii, il "Core" si espande per "mangiare" il messaggio.

**Piano di Esecuzione:**
1.  **Creare la cartella `src/frontend/components/Aether`**.
2.  **Implementare `Core.tsx`, `CommandBar.tsx`, `Stream.tsx`** con il nuovo design.
3.  **Riscrivere `App.tsx`** per usare SOLO questi componenti, eliminando Sidebar, Header complessi e pannelli laterali.
4.  **Ricompilare e Distribuire**.

Procedo con la trasformazione in "Invisible Tech"?