import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

let mainWindow: BrowserWindow | null = null;
let localServer: http.Server | null = null;
let localServerPort = 7788;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function terminateApp() {
  if (localServer) {
    try {
      localServer.close();
    } catch {
      // ignore
    }
  }
  app.exit(0);
}

const CLOSE_ACK_TIMEOUT_MS = 3000;
let closeHandlerReady = false;
let closeAckTimer: NodeJS.Timeout | null = null;

// 미저장 변경은 렌더러(Studio 확인 대화상자)가 묻는다. 렌더러가 준비되지 않았으면 바로 종료한다.
function requestQuit() {
  if (!mainWindow || mainWindow.isDestroyed() || !closeHandlerReady) {
    terminateApp();
    return;
  }
  if (closeAckTimer) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  closeAckTimer = setTimeout(confirmForceQuit, CLOSE_ACK_TIMEOUT_MS);
  mainWindow.webContents.send('app:close-request');
}

function clearCloseAckTimer() {
  if (closeAckTimer) clearTimeout(closeAckTimer);
  closeAckTimer = null;
}

// 편집기가 응답하지 않아도 앱을 닫을 수 있어야 한다 (PATCH-003)
async function confirmForceQuit() {
  clearCloseAckTimer();
  if (!mainWindow || mainWindow.isDestroyed()) {
    terminateApp();
    return;
  }
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    message: '편집기가 응답하지 않습니다.',
    detail: '지금 종료하면 저장하지 않은 변경 내용이 사라질 수 있습니다.',
    buttons: ['기다리기', '종료'],
    defaultId: 0,
    cancelId: 0,
  });
  if (response === 1) terminateApp();
}

ipcMain.on('app:close-ready', () => {
  closeHandlerReady = true;
});
ipcMain.on('app:close-ack', clearCloseAckTimer);
ipcMain.on('app:close-reply', (_event, reply: 'quit' | 'stay' | 'error') => {
  if (reply === 'quit') terminateApp();
  else if (reply === 'error') confirmForceQuit();
});

function startLocalServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const distPath = path.join(__dirname, '../dist');

    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.wasm': 'application/wasm',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.hwp': 'application/x-hwp',
    };

    localServer = http.createServer((req, res) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Access-Control-Allow-Origin', '*');

      let safeUrl = req.url ? decodeURI(req.url.split('?')[0]) : '/';
      if (safeUrl === '/') safeUrl = '/index.html';

      const filePath = path.join(distPath, safeUrl);

      if (!filePath.startsWith(distPath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          fs.readFile(path.join(distPath, 'index.html'), (indexErr, indexData) => {
            if (indexErr) {
              res.writeHead(404);
              res.end('File Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(indexData);
            }
          });
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    localServer.listen(0, '127.0.0.1', () => {
      const addr = localServer?.address();
      if (addr && typeof addr === 'object') {
        localServerPort = addr.port;
        console.log(`[RHWP STUDIO] Local production server listening on http://127.0.0.1:${localServerPort}`);
        resolve(localServerPort);
      } else {
        reject(new Error('Failed to obtain server address'));
      }
    });

    localServer.on('error', (err) => {
      reject(err);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: 'RHWP STUDIO',
    backgroundColor: '#0a0e17',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      // Studio의 편집 메뉴·우클릭·툴바 '붙이기'가 execCommand('paste')를 사용한다
      enableDeprecatedPaste: true,
    },
  });

  // iframe 내부의 beforeunload 다이얼로그나 차단 동작을 무시하고 종료 허용
  mainWindow.webContents.on('will-prevent-unload', (event) => {
    event.preventDefault();
  });

  if (isDev) {
    const devUrl = 'http://127.0.0.1:7788';
    mainWindow.loadURL(devUrl).catch(() => {
      setTimeout(() => {
        if (mainWindow) mainWindow.loadURL(devUrl);
      }, 1500);
    });
  } else {
    try {
      const port = await startLocalServer();
      mainWindow.loadURL(`http://127.0.0.1:${port}/index.html`);
    } catch (err) {
      console.error('Failed to start local server, fallback to file load:', err);
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  }

  // 페이지를 다시 불러오거나 렌더러가 죽으면 종료 확인 핸들러도 사라진다
  mainWindow.webContents.on('did-start-navigation', (details) => {
    if (details.isMainFrame && !details.isSameDocument) closeHandlerReady = false;
  });
  mainWindow.webContents.on('render-process-gone', () => {
    closeHandlerReady = false;
  });

  // 창 닫기 시 미저장 변경을 확인하고 종료
  mainWindow.on('close', (event) => {
    event.preventDefault();
    requestQuit();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupAppMenu();
}

function setupAppMenu() {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: 'RHWP STUDIO',
            submenu: [
              { role: 'about' as const, label: 'RHWP STUDIO 정보' },
              { type: 'separator' as const },
              { role: 'services' as const, label: '서비스' },
              { type: 'separator' as const },
              { role: 'hide' as const, label: 'RHWP STUDIO 숨기기' },
              { role: 'hideOthers' as const, label: '기타 숨기기' },
              { role: 'unhide' as const, label: '모두 표시' },
              { type: 'separator' as const },
              {
                label: 'RHWP STUDIO 종료',
                accelerator: 'CmdOrCtrl+Q',
                click: () => requestQuit(),
              },
            ],
          },
        ]
      : []),
    {
      label: '파일',
      submenu: [
        {
          label: '새 문서',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:action', 'new-file'),
        },
        {
          label: '문서 열기...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:action', 'open-file'),
        },
        { type: 'separator' },
        {
          label: '저장',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:action', 'save'),
        },
        {
          label: '다른 이름으로 저장...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:action', 'export-menu'),
        },
        { type: 'separator' },
        {
          label: '인쇄...',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('menu:action', 'print'),
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: isMac ? 'Cmd+Q' : 'Alt+F4',
          click: () => requestQuit(),
        },
      ],
    },
    {
      // macOS는 메뉴 role이 있어야 Cmd+X/C/V가 copy/paste 이벤트로 전달된다
      label: '편집',
      submenu: [
        { role: 'cut', label: '오려 두기' },
        { role: 'copy', label: '복사하기' },
        { role: 'paste', label: '붙이기' },
      ],
    },
    {
      label: '보기',
      submenu: [
        {
          label: '뷰어 모드 / 에디터 모드 전환',
          accelerator: 'CmdOrCtrl+M',
          click: () => mainWindow?.webContents.send('menu:action', 'toggle-mode'),
        },
        { type: 'separator' },
        { role: 'reload', label: '새로고침' },
        { role: 'forceReload', label: '강제 새로고침' },
        { role: 'toggleDevTools', label: '개발자 도구 전환' },
        { type: 'separator' },
        { role: 'resetZoom', label: '실제 크기' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '전체 화면' },
      ],
    },
    {
      label: '도움말',
      submenu: [
        {
          label: 'rhwp 오픈소스 저장소 (GitHub)',
          click: () => shell.openExternal('https://github.com/edwardkim/rhwp'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showOpenDialog(mainWindow, {
    title: '한글 문서 열기',
    filters: [
      { name: '한글 문서 (*.hwp, *.hwpx, *.hml)', extensions: ['hwp', 'hwpx', 'hml'] },
      { name: '모든 파일', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  const fileData = await fs.promises.readFile(filePath);
  const fileName = path.basename(filePath);

  return {
    canceled: false,
    filePath,
    fileName,
    fileData: new Uint8Array(fileData),
  };
});

ipcMain.handle('dialog:saveFile', async (_event, defaultName: string, extensions: string[]) => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: '문서 저장',
    defaultPath: defaultName,
    filters: [
      { name: '문서 파일', extensions },
      { name: '모든 파일', extensions: ['*'] },
    ],
  });

  return {
    canceled: result.canceled,
    filePath: result.filePath,
  };
});

ipcMain.handle('fs:writeFile', async (_event, filePath: string, buffer: Uint8Array) => {
  try {
    await fs.promises.writeFile(filePath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error('File write error:', error);
    return false;
  }
});

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  const data = await fs.promises.readFile(filePath);
  return {
    fileData: new Uint8Array(data),
    fileName: path.basename(filePath),
  };
});

ipcMain.handle('app:openExternal', async (_event, url: string) => {
  await shell.openExternal(url);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  terminateApp();
});
