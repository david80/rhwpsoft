import { contextBridge, ipcRenderer, webUtils } from 'electron';

export interface ElectronAPI {
  isElectron: boolean;
  openFileDialog: () => Promise<{ canceled: boolean; filePath?: string; fileData?: Uint8Array; fileName?: string }>;
  saveFileDialog: (defaultName: string, extensions: string[]) => Promise<{ canceled: boolean; filePath?: string }>;
  writeFile: (filePath: string, buffer: Uint8Array) => Promise<boolean>;
  readFile: (filePath: string) => Promise<{ fileData: Uint8Array; fileName: string }>;
  getPathForFile: (file: File) => string;
  onMenuAction: (callback: (action: string) => void) => () => void;
  openExternal: (url: string) => Promise<void>;
  getTitle: () => string;
}

const electronAPI: ElectronAPI = {
  isElectron: true,
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultName, extensions) => ipcRenderer.invoke('dialog:saveFile', defaultName, extensions),
  writeFile: (filePath, buffer) => ipcRenderer.invoke('fs:writeFile', filePath, buffer),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  onMenuAction: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) => callback(action);
    ipcRenderer.on('menu:action', handler);
    return () => ipcRenderer.removeListener('menu:action', handler);
  },
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  getTitle: () => 'RHWP STUDIO',
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
