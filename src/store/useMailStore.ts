import { useState, useEffect } from 'react';
import { EmailMessage, MailAccount, FolderType, ThemeId, CustomFolder } from '../types';

const INITIAL_CUSTOM_FOLDERS: CustomFolder[] = [
  { id: 'folder-work', name: '중요 업무', color: '#0a84ff' },
  { id: 'folder-archive', name: '프로젝트 보관', color: '#30d158' }
];

export function useMailStore() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [currentFolder, setCurrentFolder] = useState<FolderType>('inbox');
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>(INITIAL_CUSTOM_FOLDERS);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('macos-dark');
  const [isDeletingPromo, setIsDeletingPromo] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('');

  // 테마 변경 시 HTML body data-theme 동기화
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // 필터링된 이메일 목록 계산
  const filteredEmails = emails.filter((mail) => {
    // 1. 계정 필터
    if (selectedAccountId !== 'all' && mail.accountId !== selectedAccountId) {
      return false;
    }

    // 2. 스마트 및 커스텀 폴더 필터
    if (currentFolder === 'promo') {
      if (!mail.isPromotional) return false;
      if (mail.folder === 'Trash') return false;
    } else if (currentFolder === 'inbox') {
      // 일반 받은편지함은 광고 및 다른 커스텀 폴더로 이동된 메일 제외
      if (mail.isPromotional) return false;
      if (mail.folder !== 'INBOX') return false;
    } else if (currentFolder === 'starred') {
      if (!mail.isStarred) return false;
      if (mail.folder === 'Trash') return false;
    } else if (currentFolder === 'trash') {
      if (mail.folder !== 'Trash') return false;
    } else {
      // 커스텀 폴더인 경우
      if (mail.folder !== currentFolder) return false;
    }

    // 3. 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = mail.subject.toLowerCase().includes(q);
      const matchSender = mail.sender.name.toLowerCase().includes(q) || mail.sender.address.toLowerCase().includes(q);
      const matchBody = (mail.preview || '').toLowerCase().includes(q);
      return matchSubject || matchSender || matchBody;
    }

    return true;
  });

  // 현재 선택된 이메일
  const selectedEmail = emails.find((m) => m.id === selectedEmailId) || null;

  // 광고 메일 전체 개수 계산
  const promoCount = emails.filter((m) => {
    if (selectedAccountId !== 'all' && m.accountId !== selectedAccountId) return false;
    return m.isPromotional && m.folder !== 'Trash';
  }).length;

  // 메일 읽음 처리
  const markAsRead = (emailId: string) => {
    setEmails((prev) =>
      prev.map((m) => (m.id === emailId ? { ...m, isRead: true } : m))
    );
  };

  // 별표 토글
  const toggleStar = (emailId: string) => {
    setEmails((prev) =>
      prev.map((m) => (m.id === emailId ? { ...m, isStarred: !m.isStarred } : m))
    );
  };

  // 단일 메일 삭제 (휴지통 이동)
  const deleteEmail = (emailId: string) => {
    setEmails((prev) =>
      prev.map((m) => (m.id === emailId ? { ...m, folder: 'Trash' } : m))
    );
    if (selectedEmailId === emailId) {
      setSelectedEmailId(null);
    }
  };

  // ★ 핵심 요구사항: 광고 메일함 비우기 (실제 구글/네이버 서버 동기화)
  const emptyPromotionalMails = async () => {
    setIsDeletingPromo(true);

    const targetMails = emails.filter((m) => {
      if (selectedAccountId !== 'all' && m.accountId !== selectedAccountId) return false;
      return m.isPromotional && m.folder !== 'Trash';
    });

    if (targetMails.length === 0) {
      setIsDeletingPromo(false);
      return;
    }

    try {
      // 계정별로 묶어서 IMAP 서버 삭제 요청 전송
      const accountsMap = new Map<string, number[]>();
      targetMails.forEach((m) => {
        const uids = accountsMap.get(m.accountId) || [];
        uids.push(m.uid);
        accountsMap.set(m.accountId, uids);
      });

      if ((window as any).electronAPI?.deletePromotions) {
        for (const [accId, uids] of accountsMap.entries()) {
          const account = accounts.find((a) => a.id === accId);
          if (account) {
            await (window as any).electronAPI.deletePromotions({
              account,
              messageUids: uids
            });
          }
        }
      }

      // 로컬 상태에서도 완전히 삭제 반영
      const deletedIds = targetMails.map((m) => m.id);
      setEmails((prev) => prev.filter((m) => !deletedIds.includes(m.id)));
      setSelectedEmailId(null);
    } catch (err) {
      console.error('광고 메일 삭제 중 오류 발생:', err);
      alert('광고 메일 서버 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingPromo(false);
    }
  };

  const [oldestSeqMap, setOldestSeqMap] = useState<Record<string, number>>({});
  const [totalExistsMap, setTotalExistsMap] = useState<Record<string, number>>({});
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // 메일 동기화 (새로고침)
  const syncAccountEmails = async (targetAccount?: MailAccount) => {
    const api = (window as any).electronAPI;
    if (!api?.fetchEmails) return;

    const targets = targetAccount ? [targetAccount] : (selectedAccountId === 'all' ? accounts : accounts.filter(a => a.id === selectedAccountId));
    if (targets.length === 0) return;

    setIsSyncing(true);
    setSyncStatusText('메일함 동기화 중...');

    try {
      for (const acc of targets) {
        const res = await api.fetchEmails(acc);
        if (res.success && res.emails) {
          setEmails((prev) => {
            const others = prev.filter((m) => m.accountId !== acc.id);
            return [...others, ...res.emails];
          });
          if (res.oldestSeq) {
            setOldestSeqMap((prev) => ({ ...prev, [acc.id]: res.oldestSeq }));
          }
          if (res.totalExists) {
            setTotalExistsMap((prev) => ({ ...prev, [acc.id]: res.totalExists }));
          }
        }
      }
      setSyncStatusText('동기화 완료');
    } catch (err) {
      console.error('동기화 오류:', err);
      setSyncStatusText('동기화 실패');
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStatusText('');
      }, 1000);
    }
  };

  // 이전 메일 더 가져오기 (페이지네이션)
  const loadMoreEmails = async () => {
    const api = (window as any).electronAPI;
    if (!api?.fetchMoreEmails) return;

    // 현재 선택된 계정 (all인 경우 첫 번째 계정)
    const targetAccount = selectedAccountId === 'all'
      ? accounts[0]
      : accounts.find((a) => a.id === selectedAccountId);

    if (!targetAccount) return;

    const currentOldestSeq = oldestSeqMap[targetAccount.id];
    if (!currentOldestSeq || currentOldestSeq <= 1) {
      alert('더 이상 불러올 이전 메일이 없습니다.');
      return;
    }

    setIsLoadingMore(true);

    try {
      const res = await api.fetchMoreEmails({
        account: targetAccount,
        beforeSeq: currentOldestSeq
      });

      if (res.success && res.emails && res.emails.length > 0) {
        setEmails((prev) => {
          // 중복 방지하며 기존 메일 뒤에 누적
          const existingIds = new Set(prev.map((m) => m.id));
          const newEmails = res.emails.filter((m: any) => !existingIds.has(m.id));
          return [...prev, ...newEmails];
        });

        if (res.oldestSeq) {
          setOldestSeqMap((prev) => ({ ...prev, [targetAccount.id]: res.oldestSeq }));
        }
      }
    } catch (err) {
      console.error('추가 메일 수신 오류:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 신규 계정 추가 및 즉시 메일 가져오기
  const addAccount = async (account: MailAccount): Promise<{ success: boolean; error?: string }> => {
    setIsSyncing(true);
    setSyncStatusText(`${account.name} 연결 및 메일 수신 중...`);

    const api = (window as any).electronAPI;

    if (api?.connectAndFetch) {
      try {
        const res = await api.connectAndFetch(account);
        if (res.success) {
          setAccounts((prev) => [...prev, account]);
          if (res.emails && res.emails.length > 0) {
            setEmails((prev) => [...prev, ...res.emails]);
            setSelectedEmailId(res.emails[0].id);
          }
          if (res.oldestSeq) {
            setOldestSeqMap((prev) => ({ ...prev, [account.id]: res.oldestSeq }));
          }
          if (res.totalExists) {
            setTotalExistsMap((prev) => ({ ...prev, [account.id]: res.totalExists }));
          }
          setSelectedAccountId(account.id);
          setIsSyncing(false);
          setSyncStatusText('');
          return { success: true };
        } else {
          setIsSyncing(false);
          setSyncStatusText('');
          return { success: false, error: res.error };
        }
      } catch (err: any) {
        setIsSyncing(false);
        setSyncStatusText('');
        return { success: false, error: err.message || '서버 연결 중 예외가 발생했습니다.' };
      }
    } else {
      setAccounts((prev) => [...prev, account]);
      setSelectedAccountId(account.id);
      setIsSyncing(false);
      setSyncStatusText('');
      return { success: true };
    }
  };

  // 1. 커스텀 폴더 생성 (서버 IMAP 동기화 포함)
  const createCustomFolder = async (folderName: string) => {
    const trimmed = folderName.trim();
    if (!trimmed) return;

    const newFolder: CustomFolder = {
      id: `folder-${Date.now()}`,
      name: trimmed,
      color: '#0a84ff'
    };

    setCustomFolders((prev) => [...prev, newFolder]);

    // 등록된 첫 번째 계정 또는 현재 선택된 계정의 IMAP 서버에 폴더 생성
    const targetAccount = selectedAccountId === 'all' ? accounts[0] : accounts.find((a) => a.id === selectedAccountId);
    if (targetAccount && (window as any).electronAPI?.createFolder) {
      try {
        await (window as any).electronAPI.createFolder({
          account: targetAccount,
          folderName: trimmed
        });
      } catch (err) {
        console.warn('서버 폴더 생성 실패 (로컬 생성 유지):', err);
      }
    }
  };

  // 2. 커스텀 폴더 삭제
  const deleteCustomFolder = (folderId: string) => {
    setCustomFolders((prev) => prev.filter((f) => f.id !== folderId));
    // 삭제된 폴더에 있던 메일들은 INBOX로 복귀
    setEmails((prev) =>
      prev.map((m) => (m.folder === folderId ? { ...m, folder: 'INBOX' } : m))
    );
    if (currentFolder === folderId) {
      setCurrentFolder('inbox');
    }
  };

  // 3. 메일을 특정 폴더로 이동 (드래그 앤 드롭 및 메뉴 선택 시 호출)
  const moveEmailToFolder = async (emailId: string, targetFolderId: string) => {
    const targetMail = emails.find((m) => m.id === emailId);
    if (!targetMail || targetMail.folder === targetFolderId) return;

    const sourceFolder = targetMail.folder;

    // 로컬 상태 즉시 업데이트 (반응성 최우선)
    setEmails((prev) =>
      prev.map((m) => (m.id === emailId ? { ...m, folder: targetFolderId, isPromotional: targetFolderId === 'promo' ? true : m.isPromotional } : m))
    );

    // 대상 폴더 이름 추출
    const customF = customFolders.find((f) => f.id === targetFolderId);
    const targetServerFolderName = customF ? customF.name : (targetFolderId === 'trash' ? 'Trash' : 'INBOX');

    // IMAP 서버 이동 요청 (UID MOVE)
    const account = accounts.find((a) => a.id === targetMail.accountId);
    if (account && (window as any).electronAPI?.moveEmail) {
      try {
        await (window as any).electronAPI.moveEmail({
          account,
          uid: targetMail.uid,
          targetFolder: targetServerFolderName,
          sourceFolder: sourceFolder === 'INBOX' ? 'INBOX' : sourceFolder
        });
      } catch (err) {
        console.error('서버 메일 이동 실패:', err);
      }
    }
  };

  const currentTotalExists = selectedAccountId === 'all'
    ? Object.values(totalExistsMap).reduce((a, b) => a + b, 0)
    : (totalExistsMap[selectedAccountId] || 0);

  return {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    currentFolder,
    setCurrentFolder,
    emails: filteredEmails,
    selectedEmail,
    selectedEmailId,
    setSelectedEmailId: (id: string) => {
      setSelectedEmailId(id);
      markAsRead(id);
    },
    searchQuery,
    setSearchQuery,
    currentTheme,
    setCurrentTheme,
    promoCount,
    toggleStar,
    deleteEmail,
    emptyPromotionalMails,
    isDeletingPromo,
    addAccount,
    syncAccountEmails,
    isSyncing,
    syncStatusText,
    loadMoreEmails,
    isLoadingMore,
    totalExists: currentTotalExists,
    customFolders,
    createCustomFolder,
    deleteCustomFolder,
    moveEmailToFolder
  };
}
