# AGI Upgrade: Project J.A.R.V.I.S. (Personality & Voice Engine)

This plan transforms ARIA from a competent tool into a charismatic, cinematic AI co-pilot, implementing advanced voice synthesis, sound effects, and a distinct "Stark-like" personality.

## 1. The "Jarvis" Persona (System Prompt Overhaul)

**Goal:** Rewrite the core identity to be witty, concise, and voice-optimized.
**Target File:** `src/agent/prompt-manager.ts`
**Changes:**

* Inject strict "Voice Protocol" rules: Always use `<voice>` tags, never read code/lists aloud.

* Define "Dry Wit" personality: Competent, slightly sarcastic but helpful, concise.

* Add "Audio Context": Instruct the AI to act as if it's a voice in the user's ear.

## 2. Advanced Voice Engine (The "Vocal Cords")

**Goal:** Create a robust TTS wrapper with queuing, effects, and emotional control.
**Target File:** `src/tools/voice-engine.ts` (New)
**Features:**

* **Message Queue:** Prevents overlapping audio. Messages play sequentially.

* **Sound Effects:** Prepend system chimes (Mac's `Glass.aiff` or similar) to signal "Incoming Transmission".

* **Emotion Parsing:** Parse `<voice emotion="alert">` to adjust `say` command speed/pitch (e.g., `say -r 220` for urgency).

* **Text Cleaning:** Strip emojis/markdown from spoken text to prevent the TTS from reading "colon parenthesis".

## 3. Integration & Wiring

**Goal:** Connect the new Voice Engine to the Server/Executor.
**Target File:** `src/server.ts`
**Changes:**

* Initialize `VoiceEngine` on startup.

* In `executor.execute`, intercept the LLM response.

* Extract `<voice>` content.

* Pass to `voiceEngine.speak(content, emotion)`.

* Strip `<voice>` tags from the text sent to the Frontend (keep UI clean).

## 4. Verification

* **Test:** Ask "Status report."

* **Expectation:**

  * *SFX:* `[Ping Sound]`

  * *Voice:* "Systems nominal. I've taken the liberty of clearing the cache." (Spoken clearly)

  * *UI:* Displays full detailed log without the voice tags.

## Timeline

* **Step 1:** Create `VoiceEngine` class.

* **Step 2:** Update `PromptManager` with Jarvis Persona.

* **Step 3:** Wire into `server.ts` and test.

