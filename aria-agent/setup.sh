#!/bin/bash

echo "======================================"
echo "   ARIA Agent - Setup"
echo "======================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js non trovato!"
    echo "Installa Node.js da https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Node.js 18+ richiesto. Versione attuale: $(node -v)"
    exit 1
fi
echo "Node.js: $(node -v)"

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo ""
    echo "Ollama non trovato!"
    echo ""
    echo "Per installare Ollama:"
    echo "  Mac: brew install ollama"
    echo "  Oppure: https://ollama.ai"
    echo ""
    read -p "Vuoi continuare senza Ollama? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "Ollama: installato"

    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "Ollama server: running"
    else
        echo ""
        echo "Avviando Ollama server..."
        ollama serve &
        sleep 3
    fi

    # Check for models
    MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$MODELS" ]; then
        echo ""
        echo "Nessun modello trovato. Scarico llama3.2:3b..."
        ollama pull llama3.2:3b
    else
        echo "Modelli disponibili:"
        echo "$MODELS" | while read model; do
            echo "  - $model"
        done
    fi
fi

echo ""
echo "Installando dipendenze npm..."
npm install

echo ""
echo "======================================"
echo "   Setup completato!"
echo "======================================"
echo ""
echo "Per avviare ARIA:"
echo ""
echo "  Web UI:  npm run ui"
echo "           Poi apri http://localhost:3847"
echo ""
echo "  CLI:     npm run dev"
echo ""
echo "Modelli consigliati (scarica con: ollama pull <nome>):"
echo "  - llama3.2:3b    (veloce, 2GB)"
echo "  - codellama:7b   (coding, 4GB)"
echo "  - mistral:7b     (qualita, 4GB)"
echo ""
