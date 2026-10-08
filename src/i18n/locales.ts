export type Language = 'ko' | 'en';

export interface Translations {
  brand: {
    title: string;
    engineBadge: string;
  };
  mode: {
    viewer: string;
    editor: string;
    viewerTooltip: string;
    editorTooltip: string;
  };
  header: {
    newDoc: string;
    openFile: string;
    sampleDoc: string;
    export: string;
    docInfo: string;
  };
  exportMenu: {
    saveHwp: string;
    saveHwpx: string;
    saveHml: string;
    saveSvg: string;
    print: string;
  };
  subToolbar: {
    welcomeDoc: string;
    pagesUnit: string;
    prevPage: string;
    nextPage: string;
    zoomIn: string;
    zoomOut: string;
    zoomFit: string;
    fullscreen: string;
  };
  welcome: {
    title: string;
    subtitle: string;
    openBtn: string;
    sampleBtn: string;
    newBtn: string;
    feat1Title: string;
    feat1Desc: string;
    feat2Title: string;
    feat2Desc: string;
    feat3Title: string;
    feat3Desc: string;
  };
  dragOverlay: {
    text: string;
  };
  statusbar: {
    ready: string;
    loading: string;
    docOpened: string;
    newDocReady: string;
    shortcuts: string;
  };
  modal: {
    title: string;
    filename: string;
    format: string;
    pages: string;
    backend: string;
    license: string;
    confirm: string;
  };
  toasts: {
    switchedViewer: string;
    switchedEditor: string;
    docOpened: (name: string, pages: number) => string;
    docOpenFailed: (err: string) => string;
    newDocCreated: string;
    loadingSample: string;
    sampleFailed: string;
    downloadStarted: (filename: string) => string;
    fileSaved: (path: string) => string;
    onlyHwpAllowed: string;
  };
}

export const messages: Record<Language, Translations> = {
  ko: {
    brand: {
      title: 'RHWP STUDIO',
      engineBadge: 'v0.8.7 엔진',
    },
    mode: {
      viewer: '뷰어 모드',
      editor: '에디터 모드',
      viewerTooltip: '읽기 전용 깔끔한 뷰어 모드로 전환 (Ctrl/Cmd+M)',
      editorTooltip: '리본 메뉴와 서식 도구가 제공되는 에디터 모드로 전환 (Ctrl/Cmd+M)',
    },
    header: {
      newDoc: '새 문서',
      openFile: '파일 열기',
      sampleDoc: '샘플 열기',
      export: '내보내기 ▾',
      docInfo: '문서 정보',
    },
    exportMenu: {
      saveHwp: 'HWP 로 저장 (기본)',
      saveHwpx: 'HWPX 로 저장 (표준 XML)',
      saveHml: 'HML 로 저장 (HWPML)',
      saveSvg: 'SVG 벡터 페이지 내보내기',
      print: '문서 인쇄 / PDF 출력',
    },
    subToolbar: {
      welcomeDoc: '환영합니다 - 파일을 열어주세요',
      pagesUnit: '쪽',
      prevPage: '이전 페이지',
      nextPage: '다음 페이지',
      zoomIn: '확대',
      zoomOut: '축소',
      zoomFit: '맞춤',
      fullscreen: '전체 화면 토글',
    },
    welcome: {
      title: 'RHWP STUDIO',
      subtitle:
        '한컴 오피스 설치 없이, 브라우저와 데스크톱에서 완벽하게 구동되는 오픈소스 한글 문서 뷰어 및 편집기입니다.',
      openBtn: '한글 문서 열기',
      sampleBtn: '샘플 문서 열기',
      newBtn: '새 빈 문서',
      feat1Title: '초고속 WASM 파싱',
      feat1Desc: 'Rust 기반 엔진으로 대용량 문서도 빠르게',
      feat2Title: '완전한 서식 편집',
      feat2Desc: '표, 문단, 수식, 도형, 글자 속성 자유 편집',
      feat3Title: '100% 로컬 보안',
      feat3Desc: '서버 전송 없이 PC 내부에서 안전하게 처리',
    },
    dragOverlay: {
      text: '한글 파일(.hwp, .hwpx, .hml)을 여기에 놓아주세요',
    },
    statusbar: {
      ready: '준비 완료',
      loading: '로딩 중...',
      docOpened: '문서 열림',
      newDocReady: '새 문서 준비됨',
      shortcuts: '단축키: Ctrl/Cmd+O 열기 | Ctrl/Cmd+S 저장 | Ctrl/Cmd+M 모드전환',
    },
    modal: {
      title: '문서 및 렌더러 정보',
      filename: '문서명:',
      format: '포맷:',
      pages: '페이지 수:',
      backend: '렌더러 백엔드:',
      license: '엔진 라이선스: MIT License (edwardkim/rhwp)',
      confirm: '확인',
    },
    toasts: {
      switchedViewer: '👁️ 뷰어 모드로 전환되었습니다.',
      switchedEditor: '✏️ 에디터 모드로 전환되었습니다.',
      docOpened: (name, pages) => `"${name}" (${pages}쪽) 문서를 성공적으로 열었습니다.`,
      docOpenFailed: (err) => `문서 열기 실패: ${err}`,
      newDocCreated: '새 한글 문서가 생성되었습니다.',
      loadingSample: '예제 문서를 불러오는 중입니다...',
      sampleFailed: '샘플 문서 로드에 실패했습니다.',
      downloadStarted: (filename) => `"${filename}" 다운로드가 시작되었습니다.`,
      fileSaved: (path) => `파일이 성공적으로 저장되었습니다: ${path}`,
      onlyHwpAllowed: '한글 문서(.hwp, .hwpx, .hml) 파일만 열 수 있습니다.',
    },
  },
  en: {
    brand: {
      title: 'RHWP STUDIO',
      engineBadge: 'v0.8.7 Engine',
    },
    mode: {
      viewer: 'Viewer Mode',
      editor: 'Editor Mode',
      viewerTooltip: 'Switch to read-only clean viewer mode (Ctrl/Cmd+M)',
      editorTooltip: 'Switch to full editor mode with ribbon toolbar (Ctrl/Cmd+M)',
    },
    header: {
      newDoc: 'New Doc',
      openFile: 'Open File',
      sampleDoc: 'Sample',
      export: 'Export ▾',
      docInfo: 'Document Info',
    },
    exportMenu: {
      saveHwp: 'Save as HWP (Binary)',
      saveHwpx: 'Save as HWPX (Open XML)',
      saveHml: 'Save as HML (HWPML)',
      saveSvg: 'Export SVG Vector Page',
      print: 'Print Document / PDF',
    },
    subToolbar: {
      welcomeDoc: 'Welcome - Please open a document',
      pagesUnit: 'Pages',
      prevPage: 'Previous Page',
      nextPage: 'Next Page',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      zoomFit: 'Fit',
      fullscreen: 'Toggle Fullscreen',
    },
    welcome: {
      title: 'RHWP STUDIO',
      subtitle:
        'A modern open-source HWP/HWPX viewer & editor running completely offline in your browser and desktop without Hancom Office.',
      openBtn: 'Open HWP Document',
      sampleBtn: 'Open Sample File',
      newBtn: 'New Blank Document',
      feat1Title: 'High-speed WASM Engine',
      feat1Desc: 'Blazing fast Rust-based parser & layout pipeline',
      feat2Title: 'Full Rich Text Editing',
      feat2Desc: 'Tables, paragraphs, formulas, shapes, and font styles',
      feat3Title: '100% Local Privacy',
      feat3Desc: 'Zero server upload; completely processed in your device',
    },
    dragOverlay: {
      text: 'Drop HWP files (.hwp, .hwpx, .hml) here',
    },
    statusbar: {
      ready: 'Ready',
      loading: 'Loading...',
      docOpened: 'Document Opened',
      newDocReady: 'New Document Ready',
      shortcuts: 'Shortcuts: Ctrl/Cmd+O Open | Ctrl/Cmd+S Save | Ctrl/Cmd+M Toggle Mode',
    },
    modal: {
      title: 'Document & Renderer Diagnostics',
      filename: 'File Name:',
      format: 'Format:',
      pages: 'Page Count:',
      backend: 'Renderer Backend:',
      license: 'Engine License: MIT License (edwardkim/rhwp)',
      confirm: 'OK',
    },
    toasts: {
      switchedViewer: '👁️ Switched to Viewer Mode.',
      switchedEditor: '✏️ Switched to Editor Mode.',
      docOpened: (name, pages) => `Successfully opened "${name}" (${pages} pages).`,
      docOpenFailed: (err) => `Failed to open document: ${err}`,
      newDocCreated: 'New blank document created.',
      loadingSample: 'Loading sample document...',
      sampleFailed: 'Failed to load sample document.',
      downloadStarted: (filename) => `Download started: "${filename}".`,
      fileSaved: (path) => `File saved successfully: ${path}`,
      onlyHwpAllowed: 'Only HWP documents (.hwp, .hwpx, .hml) are supported.',
    },
  },
};
