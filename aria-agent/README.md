# ARIA - Autonomous Reasoning Intelligence Agent

Un agente AI locale super potente che gira sul tuo MacBook usando modelli GGUF locali.

---

## DISCLAIMER (IMPORTANTE)

**ARIA e un agente autonomo con accesso completo al sistema operativo.**

Utilizzando ARIA, dichiari di comprendere e accettare che:

1. **Solo Sistemi Propri**: Usa ARIA esclusivamente su computer di tua proprieta o per cui hai autorizzazione esplicita.

2. **Accesso Completo**: ARIA puo:
   - Catturare screenshot del tuo schermo
   - Controllare mouse e tastiera
   - Leggere e scrivere file
   - Eseguire comandi di sistema
   - Navigare il web automaticamente
   - Scaricare file da internet

3. **Nessuna Responsabilita**: Gli sviluppatori non sono responsabili per:
   - Danni causati dall'uso improprio di ARIA
   - Perdita di dati
   - Violazioni di sicurezza derivanti dall'uso del software
   - Azioni automatizzate non desiderate

4. **Uso Etico**: Non usare ARIA per:
   - Accedere a sistemi non autorizzati
   - Automazione malevola
   - Violazione di privacy altrui
   - Attivita illegali

**Procedendo con l'installazione e l'uso, accetti questi termini.**

---

## Il Cervello di ARIA

ARIA usa un sistema avanzato che combina le best practices dei migliori AI coding assistants:

**Pattern Integrati:**
- **ReAct Pattern** - Ragiona prima di agire, step by step
- **Plan & Execute** - Pianifica task complessi prima di eseguirli
- **Tool Calling** - Sistema di tools strutturato con validazione
- **Memory System** - Memoria persistente delle conversazioni
- **Self-Improvement** - Analizza performance e migliora autonomamente
- **Multi-Model Router** - Sceglie il modello migliore per ogni task

**Principi di Coding (dai migliori AI assistants):**
- Mai modificare codice senza leggerlo prima
- Seguire le convenzioni esistenti
- Cambiamenti minimi e focalizzati
- Security first - mai esporre credenziali
- Preferire editing vs creazione nuovi file

## Quick Start (Recommended)

```bash
cd aria-agent
./start.sh
```

This will:
1. Check Node.js and Ollama installation
2. Start Ollama server if needed
3. Download a model if none exists
4. Install dependencies
5. Launch ARIA and open browser

## Requirements

- **Node.js** 18+ (https://nodejs.org)
- **Ollama** (https://ollama.ai)

## Manual Installation

### 1. Install Ollama
```bash
# Mac
brew install ollama

# Or download from https://ollama.ai
```

### 2. Start Ollama and download a model
```bash
ollama serve
ollama pull llama3.2:3b
```

### 3. Install and start ARIA
```bash
cd aria-agent
npm install
npm run ui
```

### 4. Open browser
Go to http://localhost:3847

## Modelli Consigliati (tutti gratuiti!)

| Modello | RAM | Uso |
|---------|-----|-----|
| llama3.2:1b | 1GB | Veloce, task semplici |
| llama3.2:3b | 2GB | Bilanciato, uso generale |
| codellama:7b | 4GB | Specializzato per coding |
| deepseek-coder:6.7b | 4GB | Coding avanzato |
| mistral:7b | 4GB | Alta qualita generale |
| phi3:mini | 2GB | Microsoft Phi-3, compatto |

Per scaricare un modello:
```bash
ollama pull nome-modello
```

## Modalita di Utilizzo

### Desktop App (Recommended)
Build a standalone .app that opens with double-click:

```bash
npm install
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

Output will be in `release/` folder.

### Web UI
```bash
npm run ui
# Open http://localhost:3847
```

### CLI (Terminal)
```bash
npm run dev
```

### Electron Dev Mode
```bash
npm run electron:dev
```

## Tools Disponibili

ARIA ha accesso a questi strumenti:

**File System:**
- `read_file` - Legge file
- `write_file` - Scrive file
- `list_files` - Lista directory
- `delete_file` - Elimina file
- `search_files` - Cerca file per pattern

**Codice:**
- `execute_javascript` - Esegue codice JS
- `execute_python` - Esegue codice Python
- `shell_command` - Comandi shell
- `npm_command` - Comandi npm
- `git_command` - Comandi git

**Web:**
- `http_request` - Richieste HTTP
- `web_search` - Ricerca web (DuckDuckGo)
- `download_file` - Scarica file

## Esempi di Utilizzo

```
"Crea un sito web per il mio portfolio"
"Cerca su internet le ultime notizie su AI"
"Scrivi uno script Python che analizza un CSV"
"Crea un progetto Node.js con Express"
"Aiutami a debuggare questo codice: [codice]"
"Organizza i file nella cartella Downloads"
```

## Auto-Miglioramento

ARIA analizza le sue performance e suggerisce miglioramenti:
- Comandi: `/stats` e `/improve` nella CLI
- Nella Web UI: pannello Performance

## Struttura Dati

Tutti i dati sono salvati in `./aria-data/`:
- `conversation.json` - Storia conversazione
- `execution-logs.json` - Log esecuzioni
- `improvements.json` - Miglioramenti applicati
- `backups/` - Backup automatici

## Troubleshooting

**Ollama non risponde:**
```bash
# Verifica che sia in esecuzione
curl http://localhost:11434/api/tags

# Se non risponde, avvialo
ollama serve
```

**Modello non trovato:**
```bash
# Scarica il modello
ollama pull llama3.2:3b
```

**Performance lente:**
- Usa un modello piu piccolo (llama3.2:1b)
- Chiudi altre applicazioni
- Considera un modello quantizzato (es. :q4_0)

## Sicurezza e Safety Features

ARIA include meccanismi di sicurezza integrati:

### Consenso Primo Avvio
Al primo avvio, ARIA mostra un modal di consenso che spiega tutte le capability. L'utente deve accettare esplicitamente prima di procedere.

### Kill Switch (Pulsante STOP)
Durante l'esecuzione di task, un pulsante STOP rosso appare in basso a destra. Cliccandolo, l'esecuzione si interrompe immediatamente.

### Logging Completo
Tutte le azioni sono loggate:
- Hash SHA256 del system prompt (verifica compliance)
- Ogni tool call con parametri e risultati
- Session ID per tracciabilita

### Permessi macOS
ARIA richiede:
- **Screen Recording**: Per la funzione Vision (screenshot)
- **Accessibility**: Per il controllo mouse/tastiera
- **Automation**: Per AppleScript e controllo app

Questi permessi sono richiesti esplicitamente da macOS e non possono essere bypassati.

### Dati Locali
Tutti i dati restano sul tuo computer:
- Nessun dato inviato a server esterni
- Modello AI gira completamente in locale
- Memoria e log salvati in `./aria-data/`

## Licenza

MIT License

Copyright (c) 2024 ARIA Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
