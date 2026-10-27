import React, { useState } from 'react';
import { Mail, Tag, Star, Trash2, ShieldCheck, Layers, Folder, FolderPlus, X, Check } from 'lucide-react';
import { MailAccount, FolderType, CustomFolder } from '../types';

interface SidebarProps {
  accounts: MailAccount[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
  currentFolder: FolderType;
  onSelectFolder: (folder: FolderType) => void;
  promoCount: number;
  customFolders: CustomFolder[];
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveEmail: (emailId: string, folderId: string) => void;
  folderEmailCounts?: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  currentFolder,
  onSelectFolder,
  promoCount,
  customFolders,
  onCreateFolder,
  onDeleteFolder,
  onMoveEmail,
  folderEmailCounts = {}
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // 폴더 생성 제출
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  // 드롭 타깃 헬퍼
  const getDropHandlers = (folderId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverFolderId !== folderId) {
        setDragOverFolderId(folderId);
      }
    },
    onDragLeave: () => {
      setDragOverFolderId((prev) => (prev === folderId ? null : prev));
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const emailId = e.dataTransfer.getData('text/plain');
      if (emailId) {
        onMoveEmail(emailId, folderId);
      }
      setDragOverFolderId(null);
    }
  });

  return (
    <aside style={{
      width: '230px',
      height: '100%',
      backgroundColor: 'var(--bg-sidebar)',
      backdropFilter: 'var(--backdrop-blur)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      gap: '16px',
      flexShrink: 0,
      overflowY: 'auto'
    }}>
      {/* 1. 계정 전환 섹션 */}
      <div>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          padding: '0 8px',
          marginBottom: '8px'
        }}>
          메일 계정
        </div>
        
        {/* 전체 메일함 */}
        <button
          onClick={() => onSelectAccount('all')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: '6px',
            border: 'none',
            background: selectedAccountId === 'all' ? 'var(--bg-card-hover)' : 'transparent',
            color: selectedAccountId === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: selectedAccountId === 'all' ? 600 : 400,
            textAlign: 'left'
          }}
        >
          <Layers size={14} style={{ color: 'var(--accent)' }} />
          <span>모든 계정</span>
        </button>

        {/* 등록된 개별 계정들 */}
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => onSelectAccount(acc.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              background: selectedAccountId === acc.id ? 'var(--bg-card-hover)' : 'transparent',
              color: selectedAccountId === acc.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: selectedAccountId === acc.id ? 600 : 400,
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: acc.provider === 'gmail' ? '#ea4335' : '#03cf5d',
                flexShrink: 0
              }} />
              <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {acc.name}
              </span>
            </div>
            {acc.unreadCount && acc.unreadCount > 0 && (
              <span style={{
                fontSize: '10px',
                background: 'var(--border-subtle)',
                padding: '2px 6px',
                borderRadius: '10px',
                color: 'var(--text-muted)'
              }}>
                {acc.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 2. 스마트 메일함 섹션 (드롭 타깃 지원) */}
      <div>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          padding: '0 8px',
          marginBottom: '8px'
        }}>
          스마트 편지함
        </div>

        {/* 받은 편지함 */}
        <button
          onClick={() => onSelectFolder('inbox')}
          {...getDropHandlers('INBOX')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '6px',
            border: dragOverFolderId === 'INBOX' ? '1px dashed var(--accent)' : 'none',
            background: dragOverFolderId === 'INBOX'
              ? 'var(--accent-light)'
              : (currentFolder === 'inbox' ? 'var(--accent-light)' : 'transparent'),
            color: currentFolder === 'inbox' ? 'var(--accent)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '12.5px',
            fontWeight: currentFolder === 'inbox' ? 600 : 400,
            textAlign: 'left',
            marginBottom: '2px',
            transition: 'all 0.15s ease'
          }}
        >
          <Mail size={15} />
          <span>받은편지함</span>
        </button>

        {/* 광고/프로모션 자동 분류 편지함 */}
        <button
          onClick={() => onSelectFolder('promo')}
          {...getDropHandlers('promo')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '6px',
            border: dragOverFolderId === 'promo' ? '1px dashed var(--danger)' : 'none',
            background: dragOverFolderId === 'promo'
              ? 'var(--danger-light)'
              : (currentFolder === 'promo' ? 'var(--danger-light)' : 'transparent'),
            color: currentFolder === 'promo' ? 'var(--danger)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '12.5px',
            fontWeight: currentFolder === 'promo' ? 600 : 400,
            textAlign: 'left',
            marginBottom: '2px',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tag size={15} style={{ color: currentFolder === 'promo' ? 'var(--danger)' : 'var(--warning)' }} />
            <span>광고 / 프로모션</span>
          </div>
          {promoCount > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'var(--danger)',
              color: '#fff',
              padding: '2px 7px',
              borderRadius: '10px'
            }}>
              {promoCount}
            </span>
          )}
        </button>

        {/* 중요 편지함 */}
        <button
          onClick={() => onSelectFolder('starred')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '6px',
            border: 'none',
            background: currentFolder === 'starred' ? 'var(--accent-light)' : 'transparent',
            color: currentFolder === 'starred' ? 'var(--accent)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '12.5px',
            fontWeight: currentFolder === 'starred' ? 600 : 400,
            textAlign: 'left',
            marginBottom: '2px'
          }}
        >
          <Star size={15} style={{ color: currentFolder === 'starred' ? 'var(--accent)' : 'var(--warning)' }} />
          <span>중요 편지함</span>
        </button>

        {/* 휴지통 */}
        <button
          onClick={() => onSelectFolder('trash')}
          {...getDropHandlers('trash')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '6px',
            border: dragOverFolderId === 'trash' ? '1px dashed var(--danger)' : 'none',
            background: dragOverFolderId === 'trash'
              ? 'var(--danger-light)'
              : (currentFolder === 'trash' ? 'var(--bg-card-hover)' : 'transparent'),
            color: currentFolder === 'trash' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12.5px',
            fontWeight: currentFolder === 'trash' ? 600 : 400,
            textAlign: 'left'
          }}
        >
          <Trash2 size={15} />
          <span>휴지통</span>
        </button>
      </div>

      {/* 3. 사용자 정의 폴더 섹션 (새 폴더 생성 및 메일 드래그 앤 드롭 이동) */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            사용자 폴더
          </span>
          <button
            onClick={() => setIsCreatingFolder(true)}
            title="새 폴더 추가"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {/* 새 폴더 이름 인라인 입력창 */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateSubmit} style={{ padding: '0 4px', marginBottom: '8px', display: 'flex', gap: '4px' }}>
            <input
              type="text"
              autoFocus
              placeholder="폴더 이름 입력..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              style={{
                flex: 1,
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--accent)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={12} />
            </button>
          </form>
        )}

        {/* 사용자 폴더 목록 */}
        {customFolders.map((folder) => {
          const isSelected = currentFolder === folder.id;
          const isDragOver = dragOverFolderId === folder.id;
          const count = folderEmailCounts[folder.id] || 0;

          return (
            <div
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              {...getDropHandlers(folder.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: '6px',
                border: isDragOver ? '1px dashed var(--accent)' : '1px solid transparent',
                background: isDragOver
                  ? 'var(--accent-light)'
                  : (isSelected ? 'var(--accent-light)' : 'transparent'),
                color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: isSelected ? 600 : 400,
                marginBottom: '2px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <Folder size={14} style={{ color: folder.color || 'var(--accent)', flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {folder.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {count > 0 && (
                  <span style={{
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                    background: 'var(--border-subtle)',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {count}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`"${folder.name}" 폴더를 삭제하시겠습니까?`)) {
                      onDeleteFolder(folder.id);
                    }
                  }}
                  title="폴더 삭제"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    opacity: 0.6
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. 하단 상태 인디케이터 & 사업자 브랜드 정보 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        <div style={{
          padding: '8px 12px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
          <span>IMAP/SSL 보안 연결</span>
        </div>

        {/* 개인사업자 NOVATECHSTUDIO 크레딧 정보 */}
        <div style={{
          padding: '6px 10px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: 'var(--text-primary)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "JetBrains Mono", sans-serif'
          }}>
            NOVAMAIL
            <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>v1.0.0</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2px' }}>
            Powered by <strong>NOVATECHSTUDIO</strong>
          </div>
        </div>
      </div>
    </aside>
  );
};
