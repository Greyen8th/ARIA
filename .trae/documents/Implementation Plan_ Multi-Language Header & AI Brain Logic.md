# PIANO DI LOCALIZZAZIONE & UI HEADER
**Obiettivo:** Aggiungere un Header con selettore lingua (IT/EN) che influenzi sia la UI che il System Prompt dell'AI.

## 1. COMPONENTE "HEADER" (UI)
Creerò `src/frontend/components/Header.tsx` con un design "Glassmorphism/Neon".
*   **Logo:** SVG o testo "ARIA" con font mono.
*   **Toggle:** Un componente switch custom con animazione `framer-motion` (o CSS transition) che cambia colore: Cyan (EN) -> Purple (IT).

## 2. FRONTEND LOGIC (App & Context)
*   **Context:** Aggiornerò `AgentContext.tsx` per gestire lo stato `language` ('en' | 'it') e persisterlo in `localStorage`.
*   **Sync:** Quando cambia la lingua, il Context invierà un messaggio WebSocket speciale: `{ type: 'config', config: { language: 'it' } }`.
*   **Header:** L'Header consumerà `useAgent()` per leggere/scrivere la lingua.

## 3. BACKEND LOGIC (Brain Update)
*   **Prompt Manager:** Modificherò `src/brain/index.ts` (`buildSystemPrompt`) per accettare un parametro `language`.
    *   Se `it`: Aggiunge "CORE LANGUAGE: ITALIAN. You MUST answer in Italian."
*   **Server:** In `src/server.ts`, gestirò il messaggio WS `{ type: 'config' }`. Salverò la lingua in una variabile globale `currentLanguage` e la passerò al `executor` o rigenererò il prompt alla prossima esecuzione.

## 4. INTEGRAZIONE
1.  Creare `Header.tsx`.
2.  Aggiornare `AgentContext.tsx` con la logica lingua.
3.  Inserire `<Header />` in `App.tsx` (sopra le colonne).
4.  Aggiornare `server.ts` per ricevere la config e iniettarla nel prompt.

Procedo?