import { EditorService } from './services/editor-service';
import { FileService } from './services/file-service';
import { ToastService } from './services/toast-service';

document.addEventListener('DOMContentLoaded', async () => {
  const editorService = EditorService.getInstance();

  // Elements
  const welcomeScreen = document.getElementById('welcome-screen') as HTMLElement;
  const editorContainer = document.getElementById('editor-container') as HTMLElement;
  const dragOverlay = document.getElementById('drag-overlay') as HTMLElement;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;

  // Header Elements
  const btnModeViewer = document.getElementById('btn-mode-viewer') as HTMLButtonElement;
  const btnModeEditor = document.getElementById('btn-mode-editor') as HTMLButtonElement;
  const btnNewDoc = document.getElementById('btn-new-doc') as HTMLButtonElement;
  const btnOpenFile = document.getElementById('btn-open-file') as HTMLButtonElement;
  const btnSampleDoc = document.getElementById('btn-sample-doc') as HTMLButtonElement;
  const btnExportDropdown = document.getElementById('btn-export-dropdown') as HTMLButtonElement;
  const exportMenu = document.getElementById('export-menu') as HTMLElement;
  const btnDocInfo = document.getElementById('btn-doc-info') as HTMLButtonElement;

  // Welcome Screen Elements
  const btnWelcomeOpen = document.getElementById('btn-welcome-open') as HTMLButtonElement;
  const btnWelcomeSample = document.getElementById('btn-welcome-sample') as HTMLButtonElement;
  const btnWelcomeNew = document.getElementById('btn-welcome-new') as HTMLButtonElement;

  // Sub Toolbar Elements
  const badgeFileExt = document.getElementById('badge-file-ext') as HTMLElement;
  const labelFileName = document.getElementById('label-file-name') as HTMLElement;
  const indicatorDirty = document.getElementById('indicator-dirty') as HTMLElement;
  const btnPrevPage = document.getElementById('btn-prev-page') as HTMLButtonElement;
  const btnNextPage = document.getElementById('btn-next-page') as HTMLButtonElement;
  const indicatorPage = document.getElementById('indicator-page') as HTMLElement;
  const btnZoomIn = document.getElementById('btn-zoom-in') as HTMLButtonElement;
  const btnZoomOut = document.getElementById('btn-zoom-out') as HTMLButtonElement;
  const btnZoomFit = document.getElementById('btn-zoom-fit') as HTMLButtonElement;
  const indicatorZoom = document.getElementById('indicator-zoom') as HTMLElement;
  const btnFullscreen = document.getElementById('btn-fullscreen') as HTMLButtonElement;

  // Status Bar Elements
  const statusIndicatorDot = document.getElementById('status-indicator-dot') as HTMLElement;
  const statusText = document.getElementById('status-text') as HTMLElement;
  const statusFileSize = document.getElementById('status-file-size') as HTMLElement;
  const statusRendererBadge = document.getElementById('status-renderer-badge') as HTMLElement;

  // Modal Elements
  const docInfoModal = document.getElementById('doc-info-modal') as HTMLElement;
  const btnCloseModal = document.getElementById('btn-close-modal') as HTMLButtonElement;
  const btnCloseModalConfirm = document.getElementById('btn-close-modal-confirm') as HTMLButtonElement;
  const modalInfoFilename = document.getElementById('modal-info-filename') as HTMLElement;
  const modalInfoFormat = document.getElementById('modal-info-format') as HTMLElement;
  const modalInfoPages = document.getElementById('modal-info-pages') as HTMLElement;
  const modalInfoBackend = document.getElementById('modal-info-backend') as HTMLElement;

  // State synchronization helper
  function updateUIState() {
    const fileName = editorService.getCurrentFileName();
    const mode = editorService.getCurrentMode();
    const totalPages = editorService.getTotalPages();
    const currentPage = editorService.getCurrentPage();
    const zoom = editorService.getCurrentZoom();

    // Filename & ext badge
    labelFileName.textContent = fileName;
    const ext = (fileName.split('.').pop() || 'hwp').toUpperCase();
    badgeFileExt.textContent = ext;
    badgeFileExt.className = `doc-format-pill ${ext.toLowerCase()}`;
    indicatorDirty.style.display = 'none';

    // Status file size
    statusFileSize.style.display = 'inline';
    statusFileSize.textContent = `| ${totalPages}쪽 문서`;

    // Mode buttons
    if (mode === 'viewer') {
      btnModeViewer.classList.add('active');
      btnModeEditor.classList.remove('active');
    } else {
      btnModeEditor.classList.add('active');
      btnModeViewer.classList.remove('active');
    }

    // Page controls
    indicatorPage.textContent = `${currentPage} / ${totalPages} 쪽`;
    btnPrevPage.disabled = currentPage <= 1;
    btnNextPage.disabled = currentPage >= totalPages;

    // Zoom indicator
    indicatorZoom.textContent = `${zoom}%`;

    // Modal data
    modalInfoFilename.textContent = fileName;
    modalInfoFormat.textContent = ext;
    modalInfoPages.textContent = `${totalPages} 쪽`;
  }

  function showEditorStage() {
    welcomeScreen.style.display = 'none';
    editorContainer.classList.add('active');
  }

  // Bind EditorService state changes
  editorService.onStateChange(() => {
    showEditorStage();
    updateUIState();
  });

  // Pre-initialize Editor in the background
  try {
    statusIndicatorDot.classList.add('busy');
    statusText.textContent = 'RHWP 엔진 로딩 중...';
    await editorService.initialize(editorContainer);
    statusIndicatorDot.classList.remove('busy');
    statusText.textContent = '준비 완료';
  } catch (err) {
    console.error('Initial editor boot error:', err);
    statusIndicatorDot.classList.remove('busy');
    statusText.textContent = '엔진 초기화 오류';
  }

  // Mode toggling
  btnModeViewer.addEventListener('click', () => editorService.setMode('viewer'));
  btnModeEditor.addEventListener('click', () => editorService.setMode('editor'));

  // File open events
  btnOpenFile.addEventListener('click', () => FileService.openFile());
  btnWelcomeOpen.addEventListener('click', () => FileService.openFile());

  // Hidden input change
  fileInput.addEventListener('change', async (e) => {
    statusIndicatorDot.classList.add('busy');
    statusText.textContent = '파일 불러오는 중...';
    const success = await FileService.handleFileInputChange(e);
    statusIndicatorDot.classList.remove('busy');
    statusText.textContent = success ? '문서 열림' : '준비 완료';
  });

  // Sample doc
  async function openSample() {
    statusIndicatorDot.classList.add('busy');
    statusText.textContent = '예제 문서 로딩 중...';
    const success = await FileService.loadSampleDocument();
    statusIndicatorDot.classList.remove('busy');
    statusText.textContent = success ? '샘플 문서 열림' : '준비 완료';
  }
  btnSampleDoc.addEventListener('click', openSample);
  btnWelcomeSample.addEventListener('click', openSample);

  // New doc
  async function createNew() {
    statusIndicatorDot.classList.add('busy');
    statusText.textContent = '새 문서 작성 중...';
    await editorService.createNewDocument();
    statusIndicatorDot.classList.remove('busy');
    statusText.textContent = '새 문서 준비됨';
  }
  btnNewDoc.addEventListener('click', createNew);
  btnWelcomeNew.addEventListener('click', createNew);

  // Export dropdown
  btnExportDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    exportMenu.classList.remove('show');
  });

  document.getElementById('menu-save-hwp')?.addEventListener('click', () => {
    exportMenu.classList.remove('show');
    FileService.saveFile('hwp');
  });

  document.getElementById('menu-save-hwpx')?.addEventListener('click', () => {
    exportMenu.classList.remove('show');
    FileService.saveFile('hwpx');
  });

  document.getElementById('menu-save-hml')?.addEventListener('click', () => {
    exportMenu.classList.remove('show');
    FileService.saveFile('hml');
  });

  document.getElementById('menu-save-svg')?.addEventListener('click', () => {
    exportMenu.classList.remove('show');
    FileService.saveFile('svg');
  });

  document.getElementById('menu-print')?.addEventListener('click', () => {
    exportMenu.classList.remove('show');
    editorService.print();
  });

  // Page Controls
  btnPrevPage.addEventListener('click', () => editorService.prevPage());
  btnNextPage.addEventListener('click', () => editorService.nextPage());

  // Zoom Controls
  btnZoomIn.addEventListener('click', () => editorService.zoomIn());
  btnZoomOut.addEventListener('click', () => editorService.zoomOut());
  btnZoomFit.addEventListener('click', () => editorService.zoomFit());

  // Fullscreen
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Document Info Modal
  btnDocInfo.addEventListener('click', async () => {
    const editor = editorService.getEditor();
    if (editor) {
      try {
        const diag = await editor.getRendererDiagnostics(0);
        if (diag?.effectiveBackend) {
          modalInfoBackend.textContent = `${diag.effectiveBackend} (Active)`;
          statusRendererBadge.textContent = `Renderer: ${diag.effectiveBackend}`;
        }
      } catch {
        // Fallback
      }
    }
    docInfoModal.classList.add('open');
  });

  const closeModal = () => docInfoModal.classList.remove('open');
  btnCloseModal.addEventListener('click', closeModal);
  btnCloseModalConfirm.addEventListener('click', closeModal);
  docInfoModal.addEventListener('click', (e) => {
    if (e.target === docInfoModal) closeModal();
  });

  // Global Drag & Drop for Files
  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dragOverlay.classList.add('active');
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dragOverlay.classList.remove('active');
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    dragOverlay.classList.remove('active');

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['hwp', 'hwpx', 'hml'].includes(ext || '')) {
        statusIndicatorDot.classList.add('busy');
        statusText.textContent = '문서 로딩 중...';
        await FileService.loadBrowserFile(file);
        statusIndicatorDot.classList.remove('busy');
        statusText.textContent = '문서 열림';
      } else {
        ToastService.error('한글 문서(.hwp, .hwpx, .hml) 파일만 열 수 있습니다.');
      }
    }
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;

    if (isCmdOrCtrl && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      FileService.openFile();
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
      e.preventDefault();
      FileService.saveFile('hwp');
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      createNew();
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      const current = editorService.getCurrentMode();
      editorService.setMode(current === 'viewer' ? 'editor' : 'viewer');
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      editorService.print();
    }
  });

  // Electron IPC native menu integration
  if (window.electronAPI) {
    window.electronAPI.onMenuAction(async (action) => {
      switch (action) {
        case 'new-file':
          createNew();
          break;
        case 'open-file':
          FileService.openFile();
          break;
        case 'save-hwp':
          FileService.saveFile('hwp');
          break;
        case 'export-menu':
          exportMenu.classList.add('show');
          break;
        case 'toggle-mode': {
          const current = editorService.getCurrentMode();
          editorService.setMode(current === 'viewer' ? 'editor' : 'viewer');
          break;
        }
        case 'print':
          editorService.print();
          break;
      }
    });
  }

  // Initial state sync
  updateUIState();
});
