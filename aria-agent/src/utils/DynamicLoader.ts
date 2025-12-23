import React from 'react';

// Declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      readExternalFile: (filename: string) => Promise<string | null>;
    };
  }
}

/**
 * Loads a React component from an external JS file (Live Layer).
 * @param componentName The name of the component (e.g. "memory-dashboard")
 * @returns A React Component or null
 */
export async function loadExternalComponent(componentName: string): Promise<React.ComponentType | null> {
  // If not in Electron or API missing, return null
  if (!window.electronAPI || !window.electronAPI.readExternalFile) {
    return null;
  }

  try {
    // 1. Read file content from Main Process
    // We expect the file to be named "{componentName}.js" in the live-layer folder
    const fileContent = await window.electronAPI.readExternalFile(`${componentName}.js`);
    
    if (!fileContent) return null;

    console.log(`[DynamicLoader] Loaded external content for ${componentName}`);

    // 2. Compile the component
    // The external file MUST look like this:
    // "return function MyComponent() { return React.createElement('div', null, 'Hello'); }"
    // OR if using JSX transpiled:
    // "return ({ name }) => React.createElement('div', null, 'Hello ' + name);"
    
    // We pass 'React' and 'React.useState' etc as arguments if needed, 
    // but for simplicity we just pass 'React' object.
    
    // Safety Wrapper
    const safeFactory = new Function('React', fileContent);
    const Component = safeFactory(React);
    
    return Component;
    
  } catch (error) {
    console.error(`[DynamicLoader] Failed to load external component ${componentName}:`, error);
    return null;
  }
}
