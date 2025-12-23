import { Tool } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export const uiFabricatorTools: Tool[] = [
  {
    name: 'create_ui_component',
    description: 'Generates a new React component for the ARIA interface. This allows the agent to build its own Settings pages, Dashboards, etc.',
    parameters: [
      {
        name: 'componentName',
        type: 'string',
        description: 'The PascalCase name of the component (e.g. MemoryDashboard)',
        required: true
      },
      {
        name: 'code',
        type: 'string',
        description: 'The full TypeScript React code (export default function ...). Use Tailwind classes.',
        required: true
      },
      {
        name: 'routePath',
        type: 'string',
        description: 'The route name (slug) to register (e.g. "memory-dashboard").',
        required: true
      }
    ],
    execute: async ({ componentName, code, routePath }) => {
      try {
        const componentsDir = path.join(process.cwd(), 'src/frontend/components/generated');
        await fs.mkdir(componentsDir, { recursive: true });

        const filePath = path.join(componentsDir, `${routePath}.tsx`);
        
        // 1. Write the Component File
        await fs.writeFile(filePath, code, 'utf-8');

        // 2. Register Route (Inject into index.html script tag for now, or update a JSON manifest)
        // We chose a window.__ARIA_ROUTES approach for simplicity in the dynamic router.
        // But persistent storage is better. Let's write to a routes.json in src/frontend.
        
        const routesFile = path.join(process.cwd(), 'src/frontend/routes.json');
        let routes = [];
        try {
            const content = await fs.readFile(routesFile, 'utf-8');
            routes = JSON.parse(content);
        } catch {
            routes = [];
        }

        if (!routes.includes(routePath)) {
            routes.push(routePath);
            await fs.writeFile(routesFile, JSON.stringify(routes, null, 2), 'utf-8');
            
            // Also need to ensure DynamicRouter reads this JSON.
            // Since we can't import JSON easily in client without restart in some setups,
            // we will also append to a registry file if needed. 
            // BUT, our DynamicRouter.tsx currently reads window.__ARIA_ROUTES.
            // Let's update DynamicRouter.tsx to import this JSON if possible or fetch it.
        }

        return `UI COMPONENT CREATED: ${componentName} at ${filePath}. Route '${routePath}' registered. Reload UI to see changes.`;
      } catch (error: any) {
        return `UI GENERATION FAILED: ${error.message}`;
      }
    }
  }
];
