# PIANO "SURVIVAL MODE & MATRIX VISION"
**Role:** AGI Systems Architect & Security Specialist

Ecco il piano per trasformare Aria da "chatbot fragile" a "sistema autonomo resiliente".

---

## 1. EMERGENCY BRAIN (HuggingFace Fallback)
**Problema:** Senza Ollama/OpenAI, Aria muore.
**Soluzione:** Implementare `HuggingFaceProvider` che usa l'API di inferenza gratuita pubblica. Non richiede chiave per i modelli base (o usa una chiave pubblica di fallback se necessario, ma punteremo all'accesso guest).
*   **Azione:** Creare `src/providers/huggingface.ts`.
*   **Integrazione:** Aggiungerlo alla catena `MultiProviderEngine` come ultima spiaggia.

## 2. MATRIX VISION (AXNode / AppleScript)
**Problema:** Gli screenshot sono lenti (OCR).
**Soluzione:** Usare JXA (JavaScript for Automation) su macOS per leggere direttamente l'albero UI.
*   **Azione:** Creare `src/tools/macos-vision.ts` con il tool `macos_get_ui_tree`.
*   **Tecnica:** Eseguiremo uno script `osascript` che interroga `System Events` per ottenere la lista di finestre, bottoni e campi di testo attivi con le loro coordinate. È "Visione a Raggi X".

## 3. THE HARVESTER (Web Learning)
**Problema:** Aria legge ma dimentica.
**Soluzione:** Modificare `src/tools/web.ts` (`webSearchTool` e `browser_interact`) per salvare automaticamente i contenuti rilevanti in `memory` (Vectra).
*   **Azione:** Aggiungere un hook `memory.addLongTermMemory()` dopo ogni scraping riuscito con tag `[WEB_HARVEST]`.

## 4. CONTROLLO FISICO (Permission Check)
**Problema:** Fallimento silenzioso se mancano i permessi di accessibilità.
**Soluzione:** Aggiungere un check in `main.js` all'avvio.
*   **Azione:** Usare `systemPreferences.isTrustedAccessibilityClient(false)` (Electron API) per verificare i permessi e mostrare un dialog se mancano.

---

### PIANO OPERATIVO

1.  **Creare `src/providers/huggingface.ts`** (Emergency Brain).
2.  **Creare `src/tools/macos-vision.ts`** (Matrix Vision).
3.  **Aggiornare `src/tools/web.ts`** con logica Harvester.
4.  **Aggiornare `main.js`** con Accessibility Check.

Procedo?