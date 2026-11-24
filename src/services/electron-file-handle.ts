import { ToastService } from './toast-service';

/** Studio 저장 로직이 쓰는 FileSystemFileHandle 부분집합 */
export interface StudioFileHandle {
  readonly kind: 'file';
  readonly name: string;
  readonly path: string;
  isSameEntry(other: unknown): Promise<boolean>;
  createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
}

interface SavePickerOptions {
  suggestedName?: string;
  types?: Array<{ accept: Record<string, string | string[]> }>;
}

type StudioWindow = Window & typeof globalThis & {
  showSaveFilePicker?: (options?: SavePickerOptions) => Promise<unknown>;
};

/** 로컬 경로를 Studio 파일 핸들로 감싼다. Studio가 저장하면 같은 경로에 덮어쓴다. */
export function createElectronFileHandle(filePath: string, studioWindow: Window): StudioFileHandle {
  const { DOMException: StudioDOMException } = studioWindow as StudioWindow;
  const handle: StudioFileHandle = {
    kind: 'file',
    name: filePath.split(/[\\/]/).pop() || filePath,
    path: filePath,
    isSameEntry: async (other) => (other as StudioFileHandle | null)?.path === filePath,
    createWritable: async () => {
      const parts: Blob[] = [];
      return {
        write: async (data) => {
          parts.push(data);
        },
        close: async () => {
          const bytes = new Uint8Array(await new Blob(parts).arrayBuffer());
          const ok = bytes.length > 0 && (await window.electronAPI!.writeFile(filePath, bytes));
          if (!ok) {
            ToastService.error(`저장하지 못했습니다: ${filePath}`);
            // AbortError는 Studio가 '취소'로 처리해 문서를 저장됨으로 표시하지 않는다
            throw new StudioDOMException('write failed', 'AbortError');
          }
          ToastService.success(`파일이 성공적으로 저장되었습니다: ${filePath}`);
        },
      };
    },
  };
  return handle;
}

/** Studio의 저장 위치 선택을 Electron 저장 대화상자로 연결한다. */
export function installElectronSavePicker(studioWindow: Window): void {
  const target = studioWindow as StudioWindow;
  target.showSaveFilePicker = async (options) => {
    const extensions = (options?.types ?? [])
      .flatMap((type) => Object.values(type.accept).flat())
      .map((ext) => ext.replace(/^\./, ''));
    const res = await window.electronAPI!.saveFileDialog(options?.suggestedName ?? '', extensions);
    if (res.canceled || !res.filePath) throw new target.DOMException('canceled', 'AbortError');
    return createElectronFileHandle(res.filePath, studioWindow);
  };
}
