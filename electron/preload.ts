import { contextBridge, ipcRenderer } from 'electron';
import { MailAccount } from '../src/types';

// 브라우저 렌더러에 안전하게 노출하는 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 창 컨트롤
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // 메일 엔진 연동
  connectAndFetch: (account: MailAccount) => ipcRenderer.invoke('mail:connect-and-fetch', account),
  fetchEmails: (account: MailAccount) => ipcRenderer.invoke('mail:fetch-emails', account),
  fetchMoreEmails: (data: { account: MailAccount; beforeSeq: number }) =>
    ipcRenderer.invoke('mail:fetch-more-emails', data),
  deletePromotions: (data: { account: MailAccount; messageUids: number[] }) =>
    ipcRenderer.invoke('mail:delete-promotions', data),
  createFolder: (data: { account: MailAccount; folderName: string }) =>
    ipcRenderer.invoke('mail:create-folder', data),
  moveEmail: (data: { account: MailAccount; uid: number; targetFolder: string; sourceFolder?: string }) =>
    ipcRenderer.invoke('mail:move-email', data)
});
