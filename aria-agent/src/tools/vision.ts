import { Tool } from '../types.js';
import fetch from 'node-fetch';

// This tool communicates with the Electron Main process via a local HTTP endpoint
// because the Agent runs in a Node process (server.ts) separate from Electron Main.
// However, in our architecture, server.ts is spawned BY Electron Main.
// Communication options:
// 1. WebSocket (server.ts has a WSS) -> Electron Main connects as a client? No, Main spawned Server.
// 2. HTTP: Electron Main could expose an endpoint? Or Server exposes one?
// 3. IPC: Not directly available in Node process unless we use a socket or existing channel.
//
// SIMPLIFICATION:
// Since 'desktopCapturer' is Main process only, and we are in a child process (server.ts),
// we need a bridge.
// The easiest bridge in this setup (where Main spawns Server) is for Main to pass an env var or
// for the Server to ask the User/Client (the Frontend) to take a screenshot.
// BUT, we want "Agent takes screenshot of Desktop", not "User takes screenshot of Web App".
//
// SOLUTION:
// We will use 'nut.js' (already installed) or 'jimp' to capture screen purely in Node.
// This avoids Electron IPC complexity entirely and works headless.
// 'robotjs' or 'screenshot-desktop' are common.
// Let's check package.json for what we have. We have 'jimp' and '@nut-tree-fork/nut-js'.
// nut.js has screen.captureRegion.

import { screen, Region, FileType } from '@nut-tree-fork/nut-js';
import * as path from 'path';
import * as fs from 'fs/promises';

export const visionTools: Tool[] = [
  {
    name: 'desktop_vision_capture',
    description: 'Captures a screenshot of the current desktop screen to analyze what is visible.',
    parameters: [
        {
          name: 'filename',
          type: 'string',
          description: 'Optional filename (default: auto-generated timestamp)',
          required: false
        },
        {
            name: 'region',
            type: 'object',
            description: 'Optional region {left, top, width, height}',
            required: false,
            // Complex object schema in simplified parameter list is tricky.
            // Usually we treat it as a JSON string or simplified fields if tool parser supports it.
            // For now, let's keep it as object but note that LLM might struggle without schema.
            // Alternatively, split into left, top, width, height.
        }
    ],
    execute: async ({ filename, region }) => {
      try {
        const screenshotsDir = path.join(process.cwd(), 'aria-data', 'screenshots');
        await fs.mkdir(screenshotsDir, { recursive: true });

        const name = filename || `vision-${Date.now()}.png`;
        const filePath = path.join(screenshotsDir, name);

        // Capture
        if (region) {
            const r = new Region(region.left, region.top, region.width, region.height);
            await screen.captureRegion(name, r, FileType.PNG, screenshotsDir);
        } else {
            // Full screen
            await screen.capture(name, FileType.PNG, screenshotsDir);
        }

        return `[VISION_SUCCESS] Screenshot saved to: ${filePath}\n(Note: As a text model, I cannot 'see' this image directly yet. If you have a vision module attached, it would read this file.)`;
      } catch (error: any) {
        return `VISION ERROR: ${error.message}`;
      }
    }
  }
];
