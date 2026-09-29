import { createStudio, type RhwpEditor } from '@rhwp/editor';
import { ToastService } from './toast-service';

export type AppMode = 'viewer' | 'editor';

export class EditorService {
  private static instance: EditorService | null = null;
  private editor: RhwpEditor | null = null;
  private containerEl: HTMLElement | null = null;
  private currentMode: AppMode = 'editor';
  private currentFileName = '';
  private currentFileBytes: Uint8Array | null = null;
  private totalPages = 1;
  private currentPage = 1;
  private currentZoom = 100;

  private onStateChangeListeners: Array<() => void> = [];

  private constructor() {}

  static getInstance(): EditorService {
    if (!this.instance) {
      this.instance = new EditorService();
    }
    return this.instance;
  }

  async initialize(container: HTMLElement): Promise<RhwpEditor> {
    if (this.editor) return this.editor;
    this.containerEl = container;

    try {
      // 100% 로컬에 빌드 및 내장된 독립 rhwp-studio 번들 사용
      const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
      const localStudioUrl = `${window.location.origin}${basePath}/studio/index.html`;

      this.editor = await createStudio(container, {
        studioUrl: localStudioUrl,
        renderer: 'auto',
        plugins: ['hwpctrl'],
        chrome: {
          menu: true,
          toolbar: true,
          statusbar: true,
        },
      });

      // 에디터 생성 완료 후 초기 모드 반영
      await this.applyMode(this.currentMode);

      return this.editor;
    } catch (error) {
      console.error('Failed to create RhwpEditor:', error);
      ToastService.error('한글 에디터 엔진을 초기화하는 중 오류가 발생했습니다.');
      throw error;
    }
  }

  getEditor(): RhwpEditor | null {
    return this.editor;
  }

  getCurrentMode(): AppMode {
    return this.currentMode;
  }

  getCurrentFileName(): string {
    return this.currentFileName || '무제 문서';
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getCurrentZoom(): number {
    return this.currentZoom;
  }

  onStateChange(listener: () => void): () => void {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notifyStateChange() {
    for (const listener of this.onStateChangeListeners) {
      try {
        listener();
      } catch (e) {
        console.error('Error in state listener:', e);
      }
    }
  }

  async setMode(mode: AppMode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    await this.applyMode(mode);
    this.notifyStateChange();
    ToastService.info(mode === 'viewer' ? '👁️ 뷰어 모드로 전환되었습니다.' : '✏️ 에디터 모드로 전환되었습니다.');
  }

  private async applyMode(mode: AppMode) {
    if (!this.editor) return;

    try {
      if (mode === 'viewer') {
        // 뷰어 모드: 편집용 리본 메뉴, 툴바, 상태바를 숨겨 순수 문서 읽기 모드로 전환
        await this.editor.chrome.set({
          menu: false,
          toolbar: false,
          statusbar: false,
        });
      } else {
        // 에디터 모드: 모든 편집 도구와 메뉴바 활성화
        await this.editor.chrome.set({
          menu: true,
          toolbar: true,
          statusbar: true,
        });
      }
    } catch (e) {
      console.warn('Could not set editor chrome visibility:', e);
    }
  }

  async loadDocument(data: Uint8Array | ArrayBuffer, fileName: string): Promise<boolean> {
    if (!this.editor && this.containerEl) {
      await this.initialize(this.containerEl);
    }

    if (!this.editor) {
      ToastService.error('에디터 엔진이 준비되지 않았습니다.');
      return false;
    }

    try {
      this.currentFileName = fileName;
      this.currentFileBytes = data instanceof Uint8Array ? data : new Uint8Array(data);

      const result = await this.editor.loadFile(this.currentFileBytes, fileName, {
        suppressDialogs: true,
        skipUnsavedGuard: true,
      });

      this.totalPages = result.pageCount || (await this.editor.pageCount()) || 1;
      this.currentPage = 1;

      this.notifyStateChange();
      ToastService.success(`"${fileName}" (${this.totalPages}쪽) 문서를 성공적으로 열었습니다.`);
      return true;
    } catch (error) {
      console.error('Failed to load file:', error);
      ToastService.error(`문서 열기 실패: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async createNewDocument(): Promise<boolean> {
    if (!this.editor && this.containerEl) {
      await this.initialize(this.containerEl);
    }

    try {
      if (this.editor?.commands) {
        await this.editor.commands.execute('file:new');
      }
      this.currentFileName = '새 문서.hwp';
      this.totalPages = 1;
      this.currentPage = 1;
      this.notifyStateChange();
      ToastService.success('새 한글 문서가 생성되었습니다.');
      return true;
    } catch (error) {
      console.error('Failed to create new doc:', error);
      ToastService.error('새 문서 생성 실패');
      return false;
    }
  }

  async exportHwp(): Promise<Uint8Array | null> {
    if (!this.editor) return null;
    try {
      return await this.editor.exportHwp();
    } catch (error) {
      console.error('Failed to export HWP:', error);
      ToastService.error('HWP 내보내기 실패');
      return null;
    }
  }

  async exportHwpx(): Promise<Uint8Array | null> {
    if (!this.editor) return null;
    try {
      return await this.editor.exportHwpx();
    } catch (error) {
      console.error('Failed to export HWPX:', error);
      ToastService.error('HWPX 내보내기 실패');
      return null;
    }
  }

  async exportHml(): Promise<Uint8Array | null> {
    if (!this.editor) return null;
    try {
      return await this.editor.exportHml();
    } catch (error) {
      console.error('Failed to export HML:', error);
      ToastService.error('HML 내보내기 실패');
      return null;
    }
  }

  async exportSvg(page = 0): Promise<string | null> {
    if (!this.editor) return null;
    try {
      return await this.editor.getPageSvg(page);
    } catch (error) {
      console.error('Failed to get Page SVG:', error);
      ToastService.error('SVG 내보내기 실패');
      return null;
    }
  }

  async executeCommand(commandId: string, params?: Record<string, unknown>): Promise<boolean> {
    if (!this.editor) return false;
    try {
      const res = await this.editor.commands.execute(commandId, params, { allowDialog: true });
      return res.ok;
    } catch (error) {
      console.warn(`Command ${commandId} execution failed:`, error);
      return false;
    }
  }

  async zoomIn() {
    this.currentZoom = Math.min(250, this.currentZoom + 15);
    await this.executeCommand('view:zoom-in');
    this.notifyStateChange();
  }

  async zoomOut() {
    this.currentZoom = Math.max(40, this.currentZoom - 15);
    await this.executeCommand('view:zoom-out');
    this.notifyStateChange();
  }

  async zoomFit() {
    this.currentZoom = 100;
    await this.executeCommand('view:zoom-fit-page');
    this.notifyStateChange();
  }

  async prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      await this.executeCommand('view:prev-page');
      this.notifyStateChange();
    }
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      await this.executeCommand('view:next-page');
      this.notifyStateChange();
    }
  }

  async print() {
    if (this.editor) {
      const handled = await this.executeCommand('file:print');
      if (!handled) {
        window.print();
      }
    } else {
      window.print();
    }
  }
}
