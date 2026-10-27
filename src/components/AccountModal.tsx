import React, { useState } from 'react';
import { X, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { MailAccount, MailProvider } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: MailAccount) => Promise<{ success: boolean; error?: string }>;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount
}) => {
  const [provider, setProvider] = useState<MailProvider>('naver');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    const isGmail = provider === 'gmail';
    const newAcc: MailAccount = {
      id: `acc-${Date.now()}`,
      name: name || (isGmail ? 'Gmail 계정' : '네이버 계정'),
      email: email.trim(),
      provider,
      imapHost: isGmail ? 'imap.gmail.com' : 'imap.naver.com',
      imapPort: 993,
      smtpHost: isGmail ? 'smtp.gmail.com' : 'smtp.naver.com',
      smtpPort: 465,
      auth: {
        user: email.trim(),
        pass: password.trim()
      },
      unreadCount: 0
    };

    const result = await onAddAccount(newAcc);
    setIsLoading(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || '계정 연결에 실패했습니다. 아이디, 비밀번호 및 IMAP 설정을 확인해주세요.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999
    }}>
      <div style={{
        width: '460px',
        backgroundColor: 'var(--bg-window)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-popup)',
        padding: '24px',
        position: 'relative'
      }}>
        {/* 모달 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        <h2 style={{
          fontSize: '17px',
          fontWeight: 700,
          marginBottom: '6px',
          color: 'var(--text-primary)'
        }}>
          새 메일 계정 등록
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          지메일 또는 네이버 메일 계정을 안전한 IMAP 방식으로 연결하여 메일을 가져옵니다.
        </p>

        {/* 에러 메시지 배너 */}
        {errorMessage && (
          <div style={{
            backgroundColor: 'var(--danger-light)',
            border: '1px solid rgba(255, 69, 58, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            color: 'var(--danger)',
            fontSize: '11.5px',
            lineHeight: 1.4
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>연결 실패:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* 서비스 제공업체 선택 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <button
            type="button"
            onClick={() => { setProvider('naver'); setErrorMessage(null); }}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: provider === 'naver' ? '2px solid #03cf5d' : '1px solid var(--border-subtle)',
              backgroundColor: provider === 'naver' ? 'rgba(3, 207, 93, 0.1)' : 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#03cf5d',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px'
            }}>N</span>
            <span>네이버 메일</span>
          </button>

          <button
            type="button"
            onClick={() => { setProvider('gmail'); setErrorMessage(null); }}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: provider === 'gmail' ? '2px solid #ea4335' : '1px solid var(--border-subtle)',
              backgroundColor: provider === 'gmail' ? 'rgba(234, 67, 53, 0.1)' : 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#ea4335',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px'
            }}>G</span>
            <span>구글 (Gmail)</span>
          </button>
        </div>

        {/* 계정 입력 폼 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              사용자 표시 이름
            </label>
            <input
              type="text"
              placeholder="예: 내 네이버 메일"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              이메일 주소 (아이디)
            </label>
            <input
              type="email"
              required
              placeholder={provider === 'naver' ? '아이디@naver.com' : 'user@gmail.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              비밀번호 (애플리케이션 비밀번호 권장)
            </label>
            <input
              type="password"
              required
              placeholder="2단계 인증 사용 시 발급받은 애플리케이션 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* 안내 박스 */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: '1.5'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 600, marginBottom: '2px' }}>
              <Info size={12} />
              <span>연결 안내</span>
            </div>
            {provider === 'naver'
              ? '네이버 웹메일 환경설정 > [IMAP/SMTP 설정] 탭에서 IMAP/SMTP 사용이 [사용함]으로 체크되어 있어야 합니다.'
              : '구글 2단계 인증 계정인 경우 Google 계정 보안 > [앱 비밀번호]를 발급받아 입력해주세요.'}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '6px',
              padding: '11px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>IMAP 서버 연결 및 메일 수신 중...</span>
              </>
            ) : (
              '계정 등록 및 메일 가져오기'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
