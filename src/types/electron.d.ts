export interface ElectronAPI {
  isElectron: boolean;
  openFileDialog: () => Promise<{ canceled: boolean; filePath?: string; fileData?: Uint8Array; fileName?: string }>;
  saveFileDialog: (defaultName: string, extensions: string[]) => Promise<{ canceled: boolean; filePath?: string }>;
  writeFile: (filePath: string, buffer: Uint8Array) => Promise<boolean>;
  readFile: (filePath: string) => Promise<{ fileData: Uint8Array; fileName: string }>;
  onMenuAction: (callback: (action: string) => void) => () => void;
  openExternal: (url: string) => Promise<void>;
  getTitle: () => string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
