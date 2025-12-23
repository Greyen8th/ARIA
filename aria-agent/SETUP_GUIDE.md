# ARIA - Setup Guide

## Requirements

- **macOS**: 12.0 or later (Monterey+)
- **Processor**: Apple Silicon (M1/M2/M3/M4) recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 4GB free space (2GB for neural model)

## Installation

### 1. Download ARIA

Download the latest DMG from the releases page or build from source.

### 2. Install the App

1. Open the `.dmg` file
2. Drag `ARIA.app` to your Applications folder
3. Launch ARIA from Applications

### 3. Download Neural Core

On first launch, ARIA will display a "Neural Core Offline" screen because the AI model is not included in the app (it's 2GB).

**To download the model:**

1. Click **"DOWNLOAD MODEL"** button (or visit directly):
   ```
   https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf
   ```

2. Once downloaded, click **"OPEN MODELS FOLDER"** in ARIA

3. Move the downloaded `.gguf` file into the opened folder

4. Click **"CHECK AGAIN"** in ARIA

The neural core will initialize and ARIA will be ready to use.

## First Launch Permissions

macOS will request the following permissions:

### Accessibility
Required for:
- Screen reading (vision capabilities)
- Mouse and keyboard automation
- UI element detection

**To enable:**
1. System Settings → Privacy & Security → Accessibility
2. Toggle ARIA to ON

### Screen Recording
Required for:
- Screenshot capabilities
- Visual analysis

**To enable:**
1. System Settings → Privacy & Security → Screen Recording
2. Toggle ARIA to ON

## Quick Start

### Basic Chat
Simply type in the command bar at the bottom:
```
Ciao, chi sei?
```

### Vision Test
Ask ARIA to see your screen:
```
Cosa vedi sullo schermo?
```

### Automation Test
Ask ARIA to control your system:
```
Apri Safari
```

### File Operations
ARIA can read and write files:
```
Leggi il file ~/Desktop/test.txt
```

## Privacy & Security

- **100% Local Processing**: All AI processing happens on your device
- **No Cloud Connection**: No data is sent to external servers
- **Zero Telemetry**: No usage data is collected
- **Full Control**: You own your data and conversations

## Capabilities

ARIA is equipped with:
- **Vision**: Can see and analyze your screen
- **Voice**: Text-to-speech with emotions
- **Automation**: Control mouse, keyboard, and applications
- **Code Execution**: Run and analyze code
- **Web Access**: Fetch and scrape web content
- **Memory**: Remembers conversations and learns from them
- **Self-Improvement**: Can update its own code (with backups)

## Development Mode

To run ARIA in development mode:

```bash
# Install dependencies
npm install

# Run dev server
npm run electron:dev
```

This will start:
- Vite dev server on port 5173
- Backend server on port 3847
- Electron window with hot reload

## Building from Source

```bash
# Clean previous builds
rm -rf dist release

# Install dependencies
npm install

# Build frontend
npm run build:frontend

# Build macOS DMG
npm run dist:mac
```

Output: `release/ARIA-[version]-arm64.dmg`

## Troubleshooting

### Black Screen on Launch
1. Check Console.app for errors
2. Verify Vite dev server is running (dev mode)
3. Check that `dist/frontend/index.html` exists (prod mode)

### Neural Core Won't Load
1. Verify the `.gguf` file is in the correct folder
2. Check file size (should be ~2GB)
3. Ensure enough free RAM (model requires ~4GB when loaded)

### Permissions Not Working
1. Restart ARIA after granting permissions
2. Check System Settings → Privacy & Security
3. Some features may require Full Disk Access

### Performance Issues
- Close other heavy applications
- Ensure sufficient RAM available
- Check Activity Monitor for CPU usage
- Neural model uses Metal GPU acceleration (Apple Silicon only)

## Support

For issues, questions, or contributions:
- GitHub Issues: [project repository]
- Documentation: [docs link]
- Community: [discord/forum]

## License

MIT License - See LICENSE file for details

---

**Built with**: Electron, React, Node-Llama-CPP, Vite, TypeScript
**AI Model**: Qwen 2.5 3B Instruct (Quantized Q4)
