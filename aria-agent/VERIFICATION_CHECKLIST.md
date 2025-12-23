# ARIA 2.0 - SYSTEM VERIFICATION CHECKLIST

**Date:** 2025-12-23
**Status:** READY FOR TESTING
**Architect:** Greyen (System)

## 1. NEURAL CONNECTION TEST (The Brain)
*Objective: Verify `brain.gguf` is loaded and responsive.*

- [ ] **Launch App:** Open Aria.
- [ ] **Visual Check:** Does the "Synapse Loader" (Orbiting rings) appear initially?
- [ ] **Status Check:** Does the text "LOADING MODEL" appear below the Core?
- [ ] **Ready State:** Does the UI transition to "SYSTEM READY" or the default Ambient state after ~10-20 seconds?
- [ ] **Identity Test:** Type: `"Chi sei?"`.
    - [ ] **Expected:** "Sono ARIA..." (in Italian).
    - [ ] **Fail:** "I am Qwen..." or no response.

## 2. UI-BACKEND WIRING (The Nervous System)
*Objective: Verify WebSocket and IPC channels.*

- [ ] **Thinking State:** When you press Enter, does the Central Core pulse/expand immediately? (Blue/Cyan glow).
- [ ] **Latency:** Is the "Thinking" state triggered *before* the text response appears? (Instant feedback).
- [ ] **Streaming:** Does the response appear in the chat window?

## 3. TOOL CAPABILITIES (The Hands)
*Objective: Verify Function Calling.*

### A. Vision (Screenshot)
- [ ] **Trigger:** Type: `"Cosa vedi sul mio schermo?"` or `"Fai uno screenshot"`.
- [ ] **Backend Action:** Check terminal logs for `[CMD: SCREENSHOT]` or `Executing tool: desktop_vision_capture`.
- [ ] **Result:** Does Aria reply confirming the screenshot was taken/saved?

### B. Automation (Terminal)
- [ ] **Trigger:** Type: `"Esegui il comando 'ls -la' in questa cartella"`.
- [ ] **Safety Check:** Does Aria confirm or execute it? (Note: Execution depends on safety protocols in System Prompt, but the *intent* to call the tool should be visible).

## 4. ERROR HANDLING (Resilience)
*Objective: Verify the system doesn't crash.*

- [ ] **Disconnection:** Stop the backend server manually (Ctrl+C in terminal) while App is open.
- [ ] **UI Reaction:** Does the UI show a "Connection Lost" or Red Pulse state?
- [ ] **Reconnection:** Restart server. Does UI reconnect automatically?

## 5. PERFORMANCE METRICS
- [ ] **Startup Time:** < 5 seconds to UI visible.
- [ ] **First Token Latency:** < 2 seconds (after model load).
- [ ] **Memory Usage:** Check Activity Monitor. `Electron` + `node` should be stable.

---

**SIGNOFF:**
Tested By: ____________________
Date: ____________________
Pass/Fail: ____________________
