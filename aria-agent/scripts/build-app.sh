#!/bin/bash

echo ""
echo "========================================="
echo "   ARIA - Building Desktop App"
echo "========================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_DIR"

if [ ! -d "node_modules" ]; then
    echo "[...] Installing dependencies..."
    npm install
fi

if [ ! -f "build/icon.png" ]; then
    echo "[...] Generating app icon..."
    mkdir -p build

    cat > /tmp/generate-icon.js << 'EOF'
const { createCanvas } = require('canvas');
const fs = require('fs');

const sizes = [16, 32, 64, 128, 256, 512, 1024];
const canvas = createCanvas(1024, 1024);
const ctx = canvas.getContext('2d');

const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
gradient.addColorStop(0, '#00d4aa');
gradient.addColorStop(1, '#00a884');

ctx.fillStyle = '#0a0a0f';
ctx.fillRect(0, 0, 1024, 1024);

ctx.beginPath();
ctx.roundRect(64, 64, 896, 896, 180);
ctx.fillStyle = gradient;
ctx.fill();

ctx.font = 'bold 500px Inter, -apple-system, sans-serif';
ctx.fillStyle = '#0a0a0f';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('A', 512, 540);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('build/icon.png', buffer);

console.log('Icon generated: build/icon.png');
EOF

    if command -v node &> /dev/null && npm list canvas &> /dev/null; then
        node /tmp/generate-icon.js 2>/dev/null || echo "[SKIP] Icon generation requires 'canvas' package"
    else
        echo "[SKIP] Icon generation skipped (install canvas: npm install canvas)"
    fi
fi

echo ""
echo "[...] Building Electron app..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building for macOS..."
    npm run dist:mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Building for Linux..."
    npm run dist:linux
else
    echo "Building for Windows..."
    npm run dist:win
fi

echo ""
echo "========================================="
echo "   Build Complete!"
echo "========================================="
echo ""
echo "Output: $PROJECT_DIR/release/"
ls -la release/ 2>/dev/null || echo "Check release folder for output"
