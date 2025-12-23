export interface ElectronAPI {
  platform: string;
  versions: {
    node: string;
    electron: string;
    chrome: string;
  };
  isElectron: boolean;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  checkOllama: () => Promise<boolean>;
  startOllama: () => Promise<void>;
  getScreenshot: () => Promise<string | null>;
  readExternalFile: (filename: string) => Promise<string | null>;
  analyzeCode: (code: string) => Promise<any>;
  openModelsFolder: () => Promise<{ success: boolean; path?: string; error?: string }>;
  onServerStatus: (callback: (event: any, status: any) => void) => void;
  onOllamaStatus: (callback: (event: any, status: any) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
