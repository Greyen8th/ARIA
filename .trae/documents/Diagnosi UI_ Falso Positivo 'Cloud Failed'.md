# PIANO DI AGGIORNAMENTO UI: "STANDALONE STATUS"

**Problema:** L'interfaccia mostra "OLLAMA CORE" e "Cloud connection failed" perché sono stringhe hardcoded o basate su logica obsoleta.
**Soluzione:** Aggiornare `StatusPanel.tsx` e `AgentContext.tsx` per riflettere la nuova architettura `LocalCortex`.

## 1. AGGIORNAMENTO BACKEND (`server.ts`)
*   **Obiettivo:** Inviare lo stato del cervello al frontend.
*   **Azione:** Quando `LocalCortex` è inizializzato, inviare un messaggio WebSocket `{ type: 'brain_status', status: 'online', model: 'Local Cortex (Qwen 3B)' }`.
*   **Azione:** Modificare il loop di telemetria per includere lo stato del cervello (attualmente invia solo CPU/RAM).

## 2. AGGIORNAMENTO FRONTEND (`AgentContext.tsx`)
*   **Obiettivo:** Gestire il nuovo messaggio `brain_status`.
*   **Azione:** Aggiungere stato `brainStatus` al context.
*   **Azione:** Aggiornare il provider per ascoltare il tipo `brain_status` dal WebSocket.

## 3. AGGIORNAMENTO COMPONENTI (`StatusPanel.tsx`)
*   **Obiettivo:** Rimuovere riferimenti a Ollama.
*   **Azione:** Sostituire "OLLAMA CORE" con "LOCAL CORTEX".
*   **Azione:** Collegare l'indicatore verde allo stato reale del cervello (ricevuto via Context).
*   **Azione:** Rimuovere eventuali testi statici fuorvianti.

## PIANO OPERATIVO
1.  Modificare `server.ts` per trasmettere lo stato del cervello.
2.  Modificare `AgentContext.tsx` per ricevere e memorizzare questo stato.
3.  Modificare `StatusPanel.tsx` per mostrare "LOCAL CORTEX" invece di "OLLAMA CORE".

Procedo con le modifiche al codice?