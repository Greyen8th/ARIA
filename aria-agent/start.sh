#!/bin/bash

clear
echo ""
echo "    _    ____  ___    _    "
echo "   / \  |  _ \|_ _|  / \   "
echo "  / _ \ | |_) || |  / _ \  "
echo " / ___ \|  _ < | | / ___ \ "
echo "/_/   \_\_| \_\___/_/   \_\\"
echo ""
echo "Autonomous Reasoning Intelligence Agent"
echo "========================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

check_node() {
    if ! command -v node &> /dev/null; then
        echo "[ERROR] Node.js not found!"
        echo ""
        echo "Install Node.js 18+ from: https://nodejs.org"
        echo ""
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Or with Homebrew: brew install node"
        fi
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "[ERROR] Node.js 18+ required. Current: $(node -v)"
        exit 1
    fi
    echo "[OK] Node.js $(node -v)"
}

check_ollama() {
    if ! command -v ollama &> /dev/null; then
        echo "[WARNING] Ollama not installed"
        echo ""
        echo "To install Ollama:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  brew install ollama"
        fi
        echo "  Or download from: https://ollama.ai"
        echo ""
        return 1
    fi
    echo "[OK] Ollama installed"
    return 0
}

start_ollama() {
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "[OK] Ollama server running"
        return 0
    fi

    echo "[...] Starting Ollama server..."
    ollama serve > /dev/null 2>&1 &
    sleep 3

    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "[OK] Ollama server started"
        return 0
    fi

    echo "[WARNING] Could not start Ollama"
    return 1
}

check_models() {
    MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -5)

    if [ -z "$MODELS" ]; then
        echo ""
        echo "[...] No models found. Downloading llama3.2:3b..."
        ollama pull llama3.2:3b
    else
        echo "[OK] Models available:"
        echo "$MODELS" | while read model; do
            [ -n "$model" ] && echo "     - $model"
        done
    fi
}

install_deps() {
    if [ ! -d "node_modules" ]; then
        echo ""
        echo "[...] Installing dependencies..."
        npm install --silent
        echo "[OK] Dependencies installed"
    else
        echo "[OK] Dependencies ready"
    fi
}

start_aria() {
    echo ""
    echo "========================================="
    echo "Starting ARIA..."
    echo "========================================="
    echo ""
    echo "Opening: http://localhost:3847"
    echo ""
    echo "Press Ctrl+C to stop"
    echo ""

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sleep 2 && open "http://localhost:3847" &
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sleep 2 && xdg-open "http://localhost:3847" &
    fi

    npx tsx src/server.ts
}

echo "Checking requirements..."
echo ""

check_node

if check_ollama; then
    start_ollama
    check_models
fi

install_deps
start_aria
