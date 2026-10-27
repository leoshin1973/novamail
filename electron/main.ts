import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { MailSyncEngine } from './mailEngine';
import { MailAccount } from '../src/types';

let mainWindow: BrowserWindow | null = null;
const activeEngines = new Map<string, MailSyncEngine>();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    frame: false, // macOS 스타일의 깔끔한 프레임리스 윈도우
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e1f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // 개발 환경 또는 빌드된 정적 파일 로드
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // F12 또는 Ctrl+Shift+I로 개발자 도구 토글 가능
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// =========================================================================
// IPC 통신 핸들러 (macOS 윈도우 컨트롤 & 실제 IMAP 메일 서버 동기화)
// =========================================================================

// 1. 윈도우 제어 (신호등 버튼 동작)
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

// 2. 계정 연결 검증 및 최초 메일 가져오기
ipcMain.handle('mail:connect-and-fetch', async (_event, account: MailAccount) => {
  try {
    console.log(`[IMAP] ${account.email} 연결 시도...`);
    const engine = new MailSyncEngine(account);
    await engine.connect();
    activeEngines.set(account.id, engine);

    console.log(`[IMAP] ${account.email} 연결 성공! 최신 메일 동기화 중...`);
    const res = await engine.fetchEmails(50);
    console.log(`[IMAP] ${account.email} 동기화 완료: ${res.emails.length}건 수신 (전체 ${res.totalExists}건)`);

    return { success: true, emails: res.emails, totalExists: res.totalExists, oldestSeq: res.oldestSeq };
  } catch (err: any) {
    console.error(`[IMAP Error] ${account.email}:`, err);
    return {
      success: false,
      error: err.message || 'IMAP 서버 연결에 실패했습니다. 아이디/비밀번호 및 IMAP 설정을 확인해주세요.'
    };
  }
});

// 3. 메일 목록 새로고침 동기화 (최신 50건)
ipcMain.handle('mail:fetch-emails', async (_event, account: MailAccount) => {
  try {
    let engine = activeEngines.get(account.id);
    if (!engine) {
      engine = new MailSyncEngine(account);
      await engine.connect();
      activeEngines.set(account.id, engine);
    }

    const res = await engine.fetchEmails(50);
    return { success: true, emails: res.emails, totalExists: res.totalExists, oldestSeq: res.oldestSeq };
  } catch (err: any) {
    console.error(`[IMAP Refresh Error] ${account.email}:`, err);
    return { success: false, error: err.message };
  }
});

// 4. 이전 메일 더 가져오기 (페이지네이션)
ipcMain.handle('mail:fetch-more-emails', async (_event, { account, beforeSeq }: { account: MailAccount; beforeSeq: number }) => {
  try {
    let engine = activeEngines.get(account.id);
    if (!engine) {
      engine = new MailSyncEngine(account);
      await engine.connect();
      activeEngines.set(account.id, engine);
    }

    console.log(`[IMAP] #${beforeSeq} 이전 메일 50건 추가 요청...`);
    const res = await engine.fetchEmails(50, beforeSeq);
    return { success: true, emails: res.emails, totalExists: res.totalExists, oldestSeq: res.oldestSeq };
  } catch (err: any) {
    console.error(`[IMAP Fetch More Error] ${account.email}:`, err);
    return { success: false, error: err.message };
  }
});

// 4. 광고 메일 실제 서버 영구 삭제 (EXPUNGE)
ipcMain.handle('mail:delete-promotions', async (_event, { account, messageUids }: { account: MailAccount; messageUids: number[] }) => {
  try {
    let engine = activeEngines.get(account.id);
    if (!engine) {
      engine = new MailSyncEngine(account);
      await engine.connect();
      activeEngines.set(account.id, engine);
    }

    console.log(`[IMAP] ${account.email} 계정의 광고 메일 UID [${messageUids.join(', ')}] 서버 영구 삭제 진행`);
    await engine.deleteEmailsPermanently(messageUids);
    return { success: true, count: messageUids.length };
  } catch (err: any) {
    console.error(`[IMAP Delete Error]:`, err);
    return { success: false, error: err.message };
  }
});

// 5. 실제 서버 폴더 생성
ipcMain.handle('mail:create-folder', async (_event, { account, folderName }: { account: MailAccount; folderName: string }) => {
  try {
    let engine = activeEngines.get(account.id);
    if (!engine) {
      engine = new MailSyncEngine(account);
      await engine.connect();
      activeEngines.set(account.id, engine);
    }

    await engine.createFolder(folderName);
    return { success: true };
  } catch (err: any) {
    console.error(`[IMAP Create Folder Error]:`, err);
    return { success: false, error: err.message };
  }
});

// 6. 실제 서버 메일 이동 (UID MOVE)
ipcMain.handle('mail:move-email', async (_event, { account, uid, targetFolder, sourceFolder }: { account: MailAccount; uid: number; targetFolder: string; sourceFolder?: string }) => {
  try {
    let engine = activeEngines.get(account.id);
    if (!engine) {
      engine = new MailSyncEngine(account);
      await engine.connect();
      activeEngines.set(account.id, engine);
    }

    await engine.moveEmail(uid, targetFolder, sourceFolder || 'INBOX');
    return { success: true };
  } catch (err: any) {
    console.error(`[IMAP Move Email Error]:`, err);
    return { success: false, error: err.message };
  }
});
