import { Tool } from '../types.js';
import { mouse, keyboard, Point, Button, Key, screen, sleep } from '@nut-tree-fork/nut-js';
import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

// Helper for key mapping (Nut.js uses Key enum)
const KEY_MAP: Record<string, Key> = {
    'enter': Key.Enter,
    'space': Key.Space,
    'escape': Key.Escape,
    'tab': Key.Tab,
    'backspace': Key.Backspace,
    'up': Key.Up,
    'down': Key.Down,
    'left': Key.Left,
    'right': Key.Right,
    'command': Key.LeftCmd,
    'alt': Key.LeftAlt,
    'control': Key.LeftControl,
    'shift': Key.LeftShift,
    'cmd': Key.LeftCmd,
    'ctrl': Key.LeftControl,
    'super': Key.LeftSuper,
    'a': Key.A, 'b': Key.B, 'c': Key.C, 'd': Key.D, 'e': Key.E, 'f': Key.F,
    'g': Key.G, 'h': Key.H, 'i': Key.I, 'j': Key.J, 'k': Key.K, 'l': Key.L,
    'm': Key.M, 'n': Key.N, 'o': Key.O, 'p': Key.P, 'q': Key.Q, 'r': Key.R,
    's': Key.S, 't': Key.T, 'u': Key.U, 'v': Key.V, 'w': Key.W, 'x': Key.X,
    'y': Key.Y, 'z': Key.Z,
    '0': Key.Num0, '1': Key.Num1, '2': Key.Num2, '3': Key.Num3, '4': Key.Num4,
    '5': Key.Num5, '6': Key.Num6, '7': Key.Num7, '8': Key.Num8, '9': Key.Num9,
    'f1': Key.F1, 'f2': Key.F2, 'f3': Key.F3, 'f4': Key.F4, 'f5': Key.F5,
    'f6': Key.F6, 'f7': Key.F7, 'f8': Key.F8, 'f9': Key.F9, 'f10': Key.F10,
    'f11': Key.F11, 'f12': Key.F12
};

// Configure Nut.js
mouse.config.autoDelayMs = 10;
keyboard.config.autoDelayMs = 10;

// Browser singleton
let browserInstance: any = null;
let pageInstance: any = null;

export const osAutomationTools: Tool[] = [
  // --- MOUSE & KEYBOARD CONTROL (Nut.js) ---
  {
    name: 'os_mouse_move',
    description: 'Move the mouse cursor to specific coordinates.',
    parameters: [
      { name: 'x', type: 'number', description: 'X coordinate', required: true },
      { name: 'y', type: 'number', description: 'Y coordinate', required: true },
      { name: 'smooth', type: 'boolean', description: 'Simulate human movement', required: false }
    ],
    execute: async ({ x, y, smooth = true }) => {
      try {
        const target = new Point(x, y);
        if (smooth) {
            // Nut.js moves smoothly by default if using move, but setPosition is instant.
            // move() requires a path. simpler to use setPosition for now unless we implement path.
            // Actually nut.js move() takes a path provider.
            // For simplicity, we use setPosition which is robust.
            await mouse.setPosition(target);
        } else {
            await mouse.setPosition(target);
        }
        return `Mouse moved to ${x}, ${y}`;
      } catch (e: any) { return `Error: ${e.message}`; }
    }
  },
  {
    name: 'os_mouse_click',
    description: 'Click the mouse (left, right).',
    parameters: [
      { name: 'button', type: 'string', description: 'left, right, middle', required: false },
      { name: 'double', type: 'boolean', description: 'Double click?', required: false }
    ],
    execute: async ({ button = 'left', double = false }) => {
      try {
        let btn = Button.LEFT;
        if (button === 'right') btn = Button.RIGHT;
        if (button === 'middle') btn = Button.MIDDLE;

        if (double) {
            await mouse.doubleClick(btn);
        } else {
            await mouse.click(btn);
        }
        return `Mouse clicked (${button}${double ? ' double' : ''})`;
      } catch (e: any) { return `Error: ${e.message}`; }
    }
  },
  {
    name: 'os_keyboard_type',
    description: 'Type text using the keyboard.',
    parameters: [
      { name: 'text', type: 'string', description: 'Text to type', required: true },
      { name: 'delay', type: 'number', description: 'Delay between chars (ms)', required: false }
    ],
    execute: async ({ text }) => {
      try {
        await keyboard.type(text);
        return `Typed string: "${text}"`;
      } catch (e: any) { return `Error: ${e.message}`; }
    }
  },
  {
    name: 'os_keyboard_tap',
    description: 'Press a single key (with modifiers).',
    parameters: [
      { name: 'key', type: 'string', description: 'Key to press (e.g. "enter", "space", "a")', required: true },
      { name: 'modifiers', type: 'array', description: 'Array of modifiers ["command", "alt", "control", "shift"]', required: false }
    ],
    execute: async ({ key, modifiers = [] }) => {
      try {
        const keyEnum = KEY_MAP[key.toLowerCase()];
        if (!keyEnum) return `Error: Unknown key "${key}"`;

        const modifierEnums = modifiers.map((m: string) => KEY_MAP[m.toLowerCase()]).filter(Boolean);

        // Press modifiers
        if (modifierEnums.length > 0) {
            await keyboard.pressKey(...modifierEnums);
        }
        
        // Press key
        await keyboard.pressKey(keyEnum);
        await keyboard.releaseKey(keyEnum);

        // Release modifiers
        if (modifierEnums.length > 0) {
            await keyboard.releaseKey(...modifierEnums);
        }

        return `Pressed key: ${key} [${modifiers.join('+')}]`;
      } catch (e: any) { return `Error: ${e.message}`; }
    }
  },

  // --- VISUAL PERCEPTION (Screenshot) ---
  {
    name: 'os_get_screen_size',
    description: 'Get the screen resolution.',
    parameters: [],
    execute: async () => {
      try {
        const width = await screen.width();
        const height = await screen.height();
        return `Screen Size: ${width}x${height}`;
      } catch (e: any) { return `Error: ${e.message}`; }
    }
  },

  // --- BROWSER AUTOMATION (Puppeteer) ---
  {
    name: 'browser_launch',
    description: 'Launch a controlled Chrome browser instance.',
    parameters: [
      { name: 'headless', type: 'boolean', description: 'Run hidden?', required: false }
    ],
    execute: async ({ headless = false }) => {
      try {
        if (browserInstance) return 'Browser already running.';
        browserInstance = await puppeteer.launch({
          headless: headless ? true : false,
          defaultViewport: null,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const pages = await browserInstance.pages();
        pageInstance = pages[0];
        return 'Browser launched successfully.';
      } catch (e: any) { return `Browser launch failed: ${e.message}`; }
    }
  },
  {
    name: 'browser_navigate',
    description: 'Navigate the controlled browser to a URL.',
    parameters: [
      { name: 'url', type: 'string', description: 'URL to visit', required: true }
    ],
    execute: async ({ url }) => {
      try {
        if (!pageInstance) return 'Error: Browser not running. Use browser_launch first.';
        await pageInstance.goto(url, { waitUntil: 'domcontentloaded' });
        const title = await pageInstance.title();
        return `Navigated to: ${title}`;
      } catch (e: any) { return `Navigation error: ${e.message}`; }
    }
  },
  {
    name: 'browser_interact',
    description: 'Interact with elements on the current page (click, type, read).',
    parameters: [
      { name: 'action', type: 'string', description: 'click, type, read, screenshot', required: true },
      { name: 'selector', type: 'string', description: 'CSS selector (e.g. "#login-btn")', required: false },
      { name: 'text', type: 'string', description: 'Text to type (for type action)', required: false }
    ],
    execute: async ({ action, selector, text }) => {
      try {
        if (!pageInstance) return 'Error: Browser not running.';
        
        if (action === 'click') {
          await pageInstance.click(selector);
          return `Clicked element: ${selector}`;
        }
        if (action === 'type') {
          await pageInstance.type(selector, text || '');
          return `Typed "${text}" into ${selector}`;
        }
        if (action === 'read') {
          // If selector provided, read specific element, else read full body text
          if (selector) {
             const content = await pageInstance.$eval(selector, (el: any) => el.innerText);
             return `Content of ${selector}: ${content}`;
          } else {
             const content = await pageInstance.evaluate(() => document.body.innerText);
             return `Page Text (truncated): ${content.slice(0, 1000)}...`;
          }
        }
        if (action === 'screenshot') {
           const path = `./aria-data/screenshots/screenshot-${Date.now()}.png`;
           await fs.mkdir('./aria-data/screenshots', { recursive: true });
           await pageInstance.screenshot({ path });
           return `Screenshot saved to: ${path}`;
        }

        return 'Unknown action.';
      } catch (e: any) { return `Interaction error: ${e.message}`; }
    }
  },
  {
    name: 'browser_close',
    description: 'Close the controlled browser.',
    parameters: [],
    execute: async () => {
      if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
        pageInstance = null;
        return 'Browser closed.';
      }
      return 'Browser was not running.';
    }
  }
];
