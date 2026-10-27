import React, { useState } from 'react';
import { Trash2, Star, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { EmailMessage, FolderType, CustomFolder } from '../types';

interface MailListProps {
  emails: EmailMessage[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  currentFolder: FolderType;
  onToggleStar: (id: string) => void;
  onDeleteEmail: (id: string) => void;
  onEmptyPromotions: () => void;
  isDeletingPromo: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  totalExists?: number;
  customFolders?: CustomFolder[];
}

export const MailList: React.FC<MailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  currentFolder,
  onToggleStar,
  onDeleteEmail,
  onEmptyPromotions,
  isDeletingPromo,
  onLoadMore,
  isLoadingMore,
  totalExists = 0,
  customFolders = []
}) => {
  const [draggingEmailId, setDraggingEmailId] = useState<string | null>(null);

  // 현재 폴더 이름 계산
  const getFolderTitle = () => {
    if (currentFolder === 'inbox') return '받은편지함';
    if (currentFolder === 'promo') return '광고 / 프로모션';
    if (currentFolder === 'starred') return '중요 편지함';
    if (currentFolder === 'trash') return '휴지통';
    const custom = customFolders.find((f) => f.id === currentFolder);
    return custom ? custom.name : '메일함';
  };
  return (
    <section style={{
      width: '320px',
      height: '100%',
      backgroundColor: 'var(--bg-maillist)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* 1. 폴더 헤더 & 광고 메일함 원클릭 삭제 배너 */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: 'var(--text-primary)'
          }}>
            {getFolderTitle()}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            총 {emails.length}건
          </span>
        </div>

        {/* 광고 메일함 전용: '모두 비우기' 액션 배너 */}
        {currentFolder === 'promo' && emails.length > 0 && (
          <div style={{
            backgroundColor: 'var(--danger-light)',
            border: '1px solid rgba(255, 69, 58, 0.25)',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--danger)',
              fontWeight: 600
            }}>
              <AlertCircle size={13} />
              <span>실제 구글 / 네이버 메일함 동기화</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              비우기 실행 시 IMAP 서버에 반영되어 실제 원본 메일함에서도 영구 삭제됩니다.
            </p>
            <button
              onClick={onEmptyPromotions}
              disabled={isDeletingPromo}
              style={{
                marginTop: '4px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--danger)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '11.5px',
                cursor: isDeletingPromo ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'opacity 0.2s'
              }}
            >
              {isDeletingPromo ? (
                <>
                  <RefreshCw size={12} className="spin" />
                  <span>서버 영구 삭제 중...</span>
                </>
              ) : (
                <>
                  <Trash2 size={12} />
                  <span>광고 메일 모두 비우기 (서버 동기화)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. 메일 아이템 리스트 (드래그 지원) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
      }}>
        {emails.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '20px'
          }}>
            <Sparkles size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <div style={{ fontSize: '13px', fontWeight: 500 }}>메일함이 비어있습니다</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>새로운 메일이 도착하거나 이동하면 여기에 표시됩니다.</div>
          </div>
        ) : (
          emails.map((mail) => {
            const isSelected = mail.id === selectedEmailId;
            const isDragging = draggingEmailId === mail.id;
            return (
              <div
                key={mail.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', mail.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggingEmailId(mail.id);
                }}
                onDragEnd={() => setDraggingEmailId(null)}
                onClick={() => onSelectEmail(mail.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  cursor: 'grab',
                  backgroundColor: isSelected ? 'var(--bg-card-selected)' : 'transparent',
                  color: isSelected ? 'var(--text-card-selected)' : 'inherit',
                  transition: 'background-color 0.15s ease, opacity 0.15s ease',
                  position: 'relative',
                  border: isSelected ? 'none' : '1px solid transparent',
                  opacity: isDragging ? 0.35 : 1
                }}
              >
                {/* 상단 라인: 미확인 파란 점 + 발신자 + 날짜 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    {!mail.isRead && (
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#fff' : 'var(--accent)',
                        flexShrink: 0
                      }} />
                    )}
                    <span style={{
                      fontWeight: !mail.isRead ? 700 : 500,
                      fontSize: '12.5px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      color: isSelected ? 'var(--text-card-selected)' : 'var(--text-primary)'
                    }}>
                      {mail.sender.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                    flexShrink: 0,
                    marginLeft: '8px'
                  }}>
                    {mail.date}
                  </span>
                </div>

                {/* 제목 */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: !mail.isRead ? 600 : 400,
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  color: isSelected ? 'var(--text-card-selected)' : 'var(--text-primary)'
                }}>
                  {mail.subject}
                </div>

                {/* 2줄 미리보기 내용 */}
                <div style={{
                  fontSize: '11.5px',
                  color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.4'
                }}>
                  {mail.preview}
                </div>

                {/* 하단 태그 (광고 감지 배지 & 별표) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '6px'
                }}>
                  {mail.isPromotional ? (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--danger-light)',
                      color: isSelected ? '#fff' : 'var(--danger)',
                      border: isSelected ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,69,58,0.2)'
                    }} title={mail.promoReason}>
                      🏷️ 광고 감지
                    </span>
                  ) : <span />}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(mail.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: mail.isStarred
                          ? (isSelected ? '#fff' : 'var(--warning)')
                          : (isSelected ? 'rgba(255,255,255,0.4)' : 'var(--text-muted)')
                      }}
                    >
                      <Star size={13} fill={mail.isStarred ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEmail(mail.id);
                      }}
                      title="삭제"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* 이전 메일 더 불러오기 버튼 */}
        {emails.length > 0 && onLoadMore && (
          <div style={{ padding: '12px 8px', textAlign: 'center' }}>
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '11.5px',
                cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background-color 0.15s'
              }}
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw size={12} className="spin" />
                  <span>이전 메일 가져오는 중...</span>
                </>
              ) : (
                <span>이전 메일 50건 더 불러오기 {totalExists > 0 ? `(전체 ${totalExists}통)` : ''}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
