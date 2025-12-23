# Phase 4: Implementation Plan - "Project Aria" Upgrade

I have completed the comprehensive audit of the "Controllami" folder (including Manus, Devin, v0, Bolt, Replit, and others). I have identified critical gaps in Aria's current cognitive architecture compared to these market leaders.

## 1. Analysis & Findings (The "Super-Abilities")

| Feature | Aria (Current) | Market Leader (Source) | Verdict |
| :--- | :--- | :--- | :--- |
| **Cognitive Loop** | Reactive (responds to user) | **Devin/Manus**: Proactive `<think>` & Planning modes | **CRITICAL MISSING** |
| **Code Safety** | Direct File Edits (Risky) | **Bolt**: Atomic `<boltArtifact>` containers | **HIGH PRIORITY** |
| **UI Design** | Basic Tailwind | **v0**: Strict Design System (Fonts, Spacing, Colors) | **NEEDED FOR FABRICATOR** |
| **Self-Correction** | Basic Try/Catch | **Manus**: Structured "Agent Loop" & Capability Awareness | **NEEDED FOR AUTONOMY** |

**Selected "Super-Abilities" to Implant:**
1.  **The Strategist (Cognitive Loop):** Enforce a `<think>` block before *every* tool use to plan and validate.
2.  **The Fabricator (Design System):** Inject v0's "Mobile-First" and "3-Color Rule" constraints into UI generation tasks.
3.  **The Architect (Atomic Artifacts):** Adopt Bolt's XML artifact structure to prevent partial file writes and ensure project integrity.

## 2. Implementation Strategy

The current `prompt-manager.js` (read from `dist`) has a **critical bug**: it loads external files but *ignores* them, returning a hardcoded "Jarvis" string instead.

### Step 1: Create Modular Prompt Architecture
I will create a new directory structure `aria-agent/src/agent/prompts/` (or reuse `.bolt/` as configured) with split responsibilities:
- `core_identity.txt`: The "Aria" persona (Senior Architect + Jarvis tone).
- `cognitive_process.txt`: The "Thinking" loop (Devin style).
- `tool_protocol.txt`: The XML/Artifact usage rules (Bolt style).
- `ui_fabricator.txt`: The Design System (v0 style).

### Step 2: Rewrite `prompt-manager.ts`
I will recreate `aria-agent/src/agent/prompt-manager.ts` (since the source is missing/hidden) to:
1.  Dynamic Loading: Actually combine the text files above.
2.  Context Injection: Inject "Current Project State" (React routes, etc.) into the prompt.
3.  Prompt Caching: Avoid re-reading files on every turn if unchanged.

### Step 3: Deployment
1.  Write the new `src/agent/prompt-manager.ts`.
2.  Write the 4 new System Prompt files in `aria-agent/.bolt/`.
3.  Verify the agent loads the new "Super-Aria" personality.

## 3. User Confirmation
Please confirm to proceed with **Phase 4 (Implementation)**. This will overwrite the current Prompt Manager logic and inject the new cognitive behaviors.