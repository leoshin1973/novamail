import React, { useState } from 'react';
import { Reply, CornerUpRight, Trash2, Tag, Star, Folder, Check, Mail } from 'lucide-react';
import { EmailMessage, CustomFolder } from '../types';

interface MailViewerProps {
  email: EmailMessage | null;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  customFolders?: CustomFolder[];
  onMoveToFolder?: (emailId: string, folderId: string) => void;
}

export const MailViewer: React.FC<MailViewerProps> = ({
  email,
  onDelete,
  onToggleStar,
  customFolders = [],
  onMoveToFolder
}) => {
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  if (!email) {
    return (
      <main style={{
        flex: 1,
        height: '100%',
        backgroundColor: 'var(--bg-mailview)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          border: '1px solid var(--border-subtle)'
        }}>
          <Mail size={24} style={{ opacity: 0.6 }} />
        </div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          선택된 메일이 없습니다
        </div>
        <div style={{ fontSize: '12px', marginTop: '6px' }}>
          목록에서 메일을 클릭하여 내용을 읽어보세요.
        </div>
      </main>
    );
  }

  // 발신자 아바타 이니셜 추출
  const initial = email.sender.name ? email.sender.name.charAt(0).toUpperCase() : 'M';

  return (
    <main style={{
      flex: 1,
      height: '100%',
      backgroundColor: 'var(--bg-mailview)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 1. 상단 액션 툴바 */}
      <div style={{
        height: '48px',
        padding: '0 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            title="답장"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <Reply size={13} />
            <span>답장</span>
          </button>

          <button
            title="전달"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <CornerUpRight size={13} />
            <span>전달</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 폴더로 이동 드롭다운 */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
              title="다른 폴더로 이동"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              <Folder size={13} style={{ color: 'var(--accent)' }} />
              <span>폴더 이동</span>
            </button>

            {showFolderDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '34px',
                width: '180px',
                backgroundColor: 'var(--bg-window)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-popup)',
                padding: '6px',
                zIndex: 100
              }}>
                <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 8px' }}>
                  이동할 폴더 선택
                </div>
                {/* 기본 받은편지함 */}
                <button
                  onClick={() => {
                    onMoveToFolder?.(email.id, 'INBOX');
                    setShowFolderDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: email.folder === 'INBOX' ? 'var(--accent-light)' : 'transparent',
                    color: email.folder === 'INBOX' ? 'var(--accent)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    textAlign: 'left'
                  }}
                >
                  <Folder size={12} />
                  <span>받은편지함</span>
                </button>

                {/* 사용자 커스텀 폴더 목록 */}
                {customFolders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onMoveToFolder?.(email.id, f.id);
                      setShowFolderDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: email.folder === f.id ? 'var(--accent-light)' : 'transparent',
                      color: email.folder === f.id ? 'var(--accent)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      textAlign: 'left'
                    }}
                  >
                    <Folder size={12} style={{ color: f.color || 'var(--accent)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onToggleStar(email.id)}
            title="중요 표시"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              color: email.isStarred ? 'var(--warning)' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px'
            }}
          >
            <Star size={13} fill={email.isStarred ? 'currentColor' : 'none'} />
            <span>{email.isStarred ? '중요 해제' : '중요 보관'}</span>
          </button>

          <button
            onClick={() => onDelete(email.id)}
            title="삭제"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 69, 58, 0.2)',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px'
            }}
          >
            <Trash2 size={13} />
            <span>삭제</span>
          </button>
        </div>
      </div>

      {/* 2. 광고 자동 분류 알림 배너 */}
      {email.isPromotional && (
        <div style={{
          backgroundColor: 'var(--danger-light)',
          padding: '10px 24px',
          borderBottom: '1px solid rgba(255, 69, 58, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--danger)' }}>
            <Tag size={14} />
            <span>
              <strong>스마트 필터링 감지:</strong> {email.promoReason || '홍보성 대량 발송 메일로 판별되었습니다.'}
            </span>
          </div>
        </div>
      )}

      {/* 3. 메일 헤더 정보 (발신자, 수신자, 날짜) */}
      <div style={{
        padding: '24px 28px 16px 28px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <h1 style={{
          fontSize: '19px',
          fontWeight: 700,
          lineHeight: '1.4',
          marginBottom: '16px',
          color: 'var(--text-primary)'
        }}>
          {email.subject}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* 발신자 아바타 */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '16px',
            flexShrink: 0
          }}>
            {initial}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {email.sender.name}
                <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
                  &lt;{email.sender.address}&gt;
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {email.date}
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              받는 사람: {email.to.join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 메일 본문 콘텐츠 (HTML / 텍스트) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '28px',
        color: 'var(--text-primary)'
      }}>
        {email.html ? (
          <div
            dangerouslySetInnerHTML={{ __html: email.html }}
            style={{
              fontSize: '13.5px',
              lineHeight: '1.7',
              maxWidth: '820px'
            }}
          />
        ) : (
          <div style={{
            whiteSpace: 'pre-wrap',
            fontSize: '13.5px',
            lineHeight: '1.7',
            maxWidth: '820px'
          }}>
            {email.text}
          </div>
        )}
      </div>
    </main>
  );
};
