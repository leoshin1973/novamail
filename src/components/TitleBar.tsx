import React, { useState } from 'react';
import { Search, Palette, Plus, RefreshCw, X, Minus, Square } from 'lucide-react';
import { ThemeId, ThemeConfig } from '../types';

interface TitleBarProps {
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAccountModal: () => void;
  onSync: () => void;
  isSyncing: boolean;
  syncStatusText: string;
}

const THEMES: ThemeConfig[] = [
  { id: 'macos-dark', name: 'macOS Dark', description: '우아하고 깊은 다크 모드', colorPreview: '#1e1e1f' },
  { id: 'macos-light', name: 'macOS Light', description: '정갈하고 깨끗한 화이트', colorPreview: '#ffffff' },
  { id: 'nordic-slate', name: 'Nordic Slate', description: '차분한 차콜 블루 톤', colorPreview: '#1e2634' },
  { id: 'warm-paper', name: 'Warm Paper', description: '눈이 편안한 미색 서재 톤', colorPreview: '#f6f3ee' }
];

export const TitleBar: React.FC<TitleBarProps> = ({
  currentTheme,
  onThemeChange,
  searchQuery,
  onSearchChange,
  onOpenAccountModal,
  onSync,
  isSyncing,
  syncStatusText
}) => {
  const [showThemePicker, setShowThemePicker] = useState(false);

  // 윈도우 제어 (Electron 연동 또는 브라우저 대체)
  const handleMinimize = () => {
    (window as any).electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximizeWindow();
  };

  const handleClose = () => {
    (window as any).electronAPI?.closeWindow();
  };

  return (
    <header style={{
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-window)',
      position: 'relative',
      zIndex: 100
    }} className="titlebar-drag">
      
      {/* 1. 좌측: macOS 감성 신호등 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="titlebar-nodrag">
        <button
          onClick={handleClose}
          title="닫기"
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 'var(--traffic-red)',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease'
          }}
        />
        <button
          onClick={handleMinimize}
          title="최소화"
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 'var(--traffic-yellow)',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease'
          }}
        />
        <button
          onClick={handleMaximize}
          title="전체화면"
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 'var(--traffic-green)',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease'
          }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
          <span style={{
            fontWeight: 800,
            fontSize: '13px',
            letterSpacing: '0.4px',
            color: 'var(--text-primary)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "JetBrains Mono", sans-serif'
          }}>
            NOVAMAIL
          </span>
          <span style={{
            fontSize: '9.5px',
            fontWeight: 600,
            letterSpacing: '0.3px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent)',
            border: '1px solid rgba(10, 132, 255, 0.25)'
          }}>
            NOVATECHSTUDIO
          </span>
        </div>
      </div>

      {/* 2. 중앙: 통합 검색창 */}
      <div style={{
        flex: '0 1 420px',
        position: 'relative'
      }} className="titlebar-nodrag">
        <Search size={14} style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)'
        }} />
        <input
          type="text"
          placeholder="메일 검색 (제목, 발신자, 내용)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            height: '28px',
            padding: '0 12px 0 32px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
        />
      </div>

      {/* 3. 우측: 테마 선택기 & 계정 추가 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="titlebar-nodrag">
        {/* 테마 변경 드롭다운 토글 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            title="디자인 테마 변경"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <Palette size={13} style={{ color: 'var(--accent)' }} />
            <span>테마</span>
          </button>

          {showThemePicker && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '36px',
              width: '210px',
              background: 'var(--bg-window)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-popup)',
              padding: '8px',
              zIndex: 200
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '4px 8px',
                marginBottom: '4px'
              }}>
                디자인 테마 선택
              </div>
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeChange(theme.id);
                    setShowThemePicker(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: currentTheme === theme.id ? 'var(--accent-light)' : 'transparent',
                    color: currentTheme === theme.id ? 'var(--accent)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: currentTheme === theme.id ? 600 : 400
                  }}
                >
                  <span style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: theme.colorPreview,
                    border: '1px solid rgba(128,128,128,0.4)',
                    flexShrink: 0
                  }} />
                  <div>
                    <div>{theme.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 동기화(새로고침) 버튼 */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          title="최신 메일 동기화 (새로고침)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: isSyncing ? 0.7 : 1
          }}
        >
          <RefreshCw size={13} className={isSyncing ? 'spin' : ''} style={{ color: 'var(--accent)' }} />
          <span>{isSyncing ? (syncStatusText || '동기화 중...') : '동기화'}</span>
        </button>

        {/* 계정 추가 버튼 */}
        <button
          onClick={onOpenAccountModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'opacity 0.15s'
          }}
        >
          <Plus size={14} />
          <span>계정 추가</span>
        </button>
      </div>

    </header>
  );
};
