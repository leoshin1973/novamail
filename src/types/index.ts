// 메일 계정 정보
export type MailProvider = 'gmail' | 'naver' | 'custom';

export interface MailAccount {
  id: string;
  name: string;
  email: string;
  provider: MailProvider;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  auth: {
    user: string;
    pass: string; // 앱 비밀번호
  };
  unreadCount?: number;
}

// 이메일 메시지 상세
export interface EmailMessage {
  id: string;
  uid: number; // IMAP 고유 UID (실제 서버 삭제용)
  accountId: string;
  subject: string;
  sender: {
    name: string;
    address: string;
  };
  to: string[];
  date: string;
  preview: string;
  html?: string;
  text?: string;
  isRead: boolean;
  isStarred: boolean;
  // 광고/프로모션 자동 분류 속성
  isPromotional: boolean;
  promoReason?: string; // 예: "제목에 [광고] 표기", "구독해지 헤더(List-Unsubscribe) 감지"
  folder: string; // 'INBOX', 'Trash', 등
  attachments?: {
    filename: string;
    size: number;
    contentType: string;
  }[];
}

// 스마트 폴더 종류 (기본 편지함 + 사용자 정의 폴더 id 지원)
export type DefaultFolderType = 'inbox' | 'promo' | 'starred' | 'sent' | 'trash';
export type FolderType = DefaultFolderType | string;

// 사용자 정의 커스텀 폴더
export interface CustomFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

// 감각적인 테마 종류
export type ThemeId = 'macos-dark' | 'macos-light' | 'nordic-slate' | 'warm-paper';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  colorPreview: string; // 프리뷰용 대표 색상 헥스코드
}
