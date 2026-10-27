import React, { useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { MailList } from './components/MailList';
import { MailViewer } from './components/MailViewer';
import { AccountModal } from './components/AccountModal';
import { useMailStore } from './store/useMailStore';

export const App: React.FC = () => {
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    currentFolder,
    setCurrentFolder,
    emails,
    selectedEmail,
    selectedEmailId,
    setSelectedEmailId,
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
    totalExists,
    customFolders,
    createCustomFolder,
    deleteCustomFolder,
    moveEmailToFolder
  } = useMailStore();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // 폴더별 메일 건수 계산
  const folderEmailCounts = customFolders.reduce((acc, folder) => {
    acc[folder.id] = emails.filter((m) => m.folder === folder.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-window)'
    }}>
      {/* 1. 상단 macOS 타이틀바 */}
      <TitleBar
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onSync={() => syncAccountEmails()}
        isSyncing={isSyncing}
        syncStatusText={syncStatusText}
      />

      {/* 2. 3단 분할 레이아웃 (사이드바 - 메일목록 - 메일뷰어) */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* 좌측 사이드바 (계정, 스마트 폴더, 커스텀 폴더 & 드롭 타깃) */}
        <Sidebar
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          currentFolder={currentFolder}
          onSelectFolder={setCurrentFolder}
          promoCount={promoCount}
          customFolders={customFolders}
          onCreateFolder={createCustomFolder}
          onDeleteFolder={deleteCustomFolder}
          onMoveEmail={moveEmailToFolder}
          folderEmailCounts={folderEmailCounts}
        />

        {/* 중앙 메일 리스트 (메일 드래그 지원) */}
        <MailList
          emails={emails}
          selectedEmailId={selectedEmailId}
          onSelectEmail={setSelectedEmailId}
          currentFolder={currentFolder}
          onToggleStar={toggleStar}
          onDeleteEmail={deleteEmail}
          onEmptyPromotions={emptyPromotionalMails}
          isDeletingPromo={isDeletingPromo}
          onLoadMore={loadMoreEmails}
          isLoadingMore={isLoadingMore}
          totalExists={totalExists}
          customFolders={customFolders}
        />

        {/* 우측 메일 본문 뷰어 (상단 폴더 이동 메뉴 지원) */}
        <MailViewer
          email={selectedEmail}
          onDelete={deleteEmail}
          onToggleStar={toggleStar}
          customFolders={customFolders}
          onMoveToFolder={moveEmailToFolder}
        />
      </div>

      {/* 3. 계정 등록 팝업 모달 */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onAddAccount={addAccount}
      />
    </div>
  );
};

export default App;
