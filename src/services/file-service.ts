import { EditorService } from './editor-service';
import { HistoryStore } from './history-store';
import { ToastService } from './toast-service';

export class FileService {
  private static editorService = EditorService.getInstance();

  static isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }

  static async openFile(): Promise<boolean> {
    if (this.isElectron() && window.electronAPI) {
      try {
        const res = await window.electronAPI.openFileDialog();
        if (res.canceled || !res.fileData || !res.fileName) return false;

        const success = await this.editorService.loadDocument(res.fileData, res.fileName);
        if (success) {
          HistoryStore.addRecentDoc(res.fileName, res.fileData.byteLength);
        }
        return success;
      } catch (err) {
        console.error('Electron open file error:', err);
        ToastService.error('파일 열기 중 오류가 발생했습니다.');
        return false;
      }
    } else {
      // Browser fallback: trigger hidden input
      const input = document.getElementById('file-input') as HTMLInputElement | null;
      if (input) {
        input.value = '';
        input.click();
      }
      return true;
    }
  }

  static async handleFileInputChange(e: Event): Promise<boolean> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return false;

    return await this.loadBrowserFile(file);
  }

  static async loadBrowserFile(file: File): Promise<boolean> {
    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const success = await this.editorService.loadDocument(uint8, file.name);
      if (success) {
        HistoryStore.addRecentDoc(file.name, file.size);
      }
      return success;
    } catch (err) {
      console.error('Failed to read file:', err);
      ToastService.error('파일 읽기에 실패했습니다.');
      return false;
    }
  }

  static async loadSampleDocument(): Promise<boolean> {
    try {
      ToastService.info('예제 문서를 불러오는 중입니다...');
      const res = await fetch('./sample.hwp');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const buffer = await res.arrayBuffer();
      const success = await this.editorService.loadDocument(buffer, '2010-01-06 (샘플문서).hwp');
      if (success) {
        HistoryStore.addRecentDoc('2010-01-06 (샘플문서).hwp', buffer.byteLength);
      }
      return success;
    } catch (err) {
      console.error('Failed to load sample:', err);
      ToastService.error('샘플 문서 로드에 실패했습니다.');
      return false;
    }
  }

  static async saveFile(format: 'hwp' | 'hwpx' | 'hml' | 'svg' = 'hwp'): Promise<boolean> {
    const defaultBaseName = this.editorService.getCurrentFileName().replace(/\.[^/.]+$/, '');
    let ext = format;
    let data: Uint8Array | null = null;
    let svgContent: string | null = null;

    if (format === 'hwp') {
      data = await this.editorService.exportHwp();
    } else if (format === 'hwpx') {
      data = await this.editorService.exportHwpx();
    } else if (format === 'hml') {
      data = await this.editorService.exportHml();
    } else if (format === 'svg') {
      svgContent = await this.editorService.exportSvg(0);
      if (svgContent) {
        data = new TextEncoder().encode(svgContent);
      }
    }

    if (!data) {
      ToastService.error(`${format.toUpperCase()} 데이터 생성에 실패했습니다.`);
      return false;
    }

    const defaultFullName = `${defaultBaseName}.${ext}`;

    if (this.isElectron() && window.electronAPI) {
      try {
        const dialogRes = await window.electronAPI.saveFileDialog(defaultFullName, [ext]);
        if (dialogRes.canceled || !dialogRes.filePath) return false;

        const writeSuccess = await window.electronAPI.writeFile(dialogRes.filePath, data);
        if (writeSuccess) {
          ToastService.success(`파일이 성공적으로 저장되었습니다: ${dialogRes.filePath}`);
          return true;
        } else {
          ToastService.error('파일 쓰기에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('Electron save error:', err);
        ToastService.error('파일 저장 실패');
        return false;
      }
    } else {
      // Browser download
      const mime =
        format === 'hwp'
          ? 'application/x-hwp'
          : format === 'hwpx'
          ? 'application/vnd.hancom.hwpx'
          : format === 'hml'
          ? 'application/xml'
          : 'image/svg+xml';

      const blob = new Blob([data as unknown as BlobPart], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFullName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      ToastService.success(`"${defaultFullName}" 다운로드가 시작되었습니다.`);
      return true;
    }
  }
}
