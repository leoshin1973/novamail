import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { MailAccount, EmailMessage } from '../src/types';

/**
 * 광고/홍보 메일 자동 판별 알고리즘
 */
export function detectPromotionalEmail(parsed: any, subject: string, fromAddress: string): { isPromo: boolean; reason?: string } {
  const cleanSubject = subject || '';
  
  // 1. 한국 정보통신망법상 광고 표기 필터링
  if (cleanSubject.includes('(광고)') || cleanSubject.includes('[광고]')) {
    return { isPromo: true, reason: '제목에 (광고)/[광고] 법적 문구 표기 감지' };
  }

  // 2. List-Unsubscribe 헤더
  if (parsed.headers && parsed.headers.get('list-unsubscribe')) {
    return { isPromo: true, reason: '뉴스레터/프로모션 구독해지(List-Unsubscribe) 헤더 감지' };
  }

  // 3. Precedence 벌크 헤더
  const precedence = parsed.headers?.get('precedence');
  if (precedence === 'bulk' || precedence === 'list') {
    return { isPromo: true, reason: '대량 발송 메일(Precedence: bulk) 감지' };
  }

  // 4. 발신자 주소 패턴
  const lowerFrom = fromAddress.toLowerCase();
  if (
    lowerFrom.includes('newsletter') ||
    lowerFrom.includes('marketing') ||
    lowerFrom.includes('promo') ||
    lowerFrom.includes('advertisement') ||
    lowerFrom.includes('sale@')
  ) {
    return { isPromo: true, reason: '마케팅/프로모션 발송 주소 패턴 감지' };
  }

  return { isPromo: false };
}

/**
 * IMAP 클라이언트 헬퍼 클래스
 */
export class MailSyncEngine {
  private client: ImapFlow | null = null;
  private account: MailAccount;

  constructor(account: MailAccount) {
    this.account = account;
  }

  // IMAP 서버 연결 (아이디 전체형식과 축약형식 모두 자동 시도)
  async connect(): Promise<boolean> {
    const rawUser = this.account.auth.user.trim();
    const rawPass = this.account.auth.pass.trim();

    // 네이버 계정일 경우: 1) hcshin12@naver.com 과 2) hcshin12 둘 다 준비
    const baseId = rawUser.includes('@') ? rawUser.split('@')[0] : rawUser;
    const fullEmail = rawUser.includes('@') ? rawUser : `${rawUser}@naver.com`;

    const userCandidates = this.account.provider === 'naver'
      ? [fullEmail, baseId]
      : [rawUser];

    let lastError: any = null;

    for (const testUser of userCandidates) {
      try {
        console.log(`[IMAP] 아이디 시도: "${testUser}"...`);
        const client = new ImapFlow({
          host: this.account.imapHost,
          port: this.account.imapPort,
          secure: true,
          auth: {
            user: testUser,
            pass: rawPass
          },
          logger: false
        });

        await client.connect();
        this.client = client;
        console.log(`[IMAP] "${testUser}" 계정 인증 성공!`);
        return true;
      } catch (err: any) {
        lastError = err;
        console.warn(`[IMAP] "${testUser}" 인증 실패 (${err.message}). 다음 형식 확인 중...`);
      }
    }

    console.error(`[IMAP Connect Final Error] ${this.account.email}:`, lastError);
    throw lastError;
  }

  // 메일 목록 가져오기 (페이지네이션 지원 및 전체 보관 건수 파악)
  async fetchEmails(limit: number = 50, beforeSeq?: number): Promise<{ emails: EmailMessage[]; totalExists: number; oldestSeq: number }> {
    if (!this.client) throw new Error('IMAP 클라이언트가 연결되지 않았습니다.');

    const lock = await this.client.getMailboxLock('INBOX');
    const result: EmailMessage[] = [];

    try {
      const mailbox = this.client.mailbox;
      if (!mailbox || mailbox.exists === 0) {
        return { emails: [], totalExists: 0, oldestSeq: 0 };
      }

      const totalExists = mailbox.exists;
      // beforeSeq가 없으면 가장 최신 메일부터 시작
      const endSeq = beforeSeq ? Math.min(beforeSeq - 1, totalExists) : totalExists;
      if (endSeq <= 0) {
        return { emails: [], totalExists, oldestSeq: 0 };
      }

      const startSeq = Math.max(1, endSeq - limit + 1);

      console.log(`[IMAP] 메일 수신 범위: #${startSeq} ~ #${endSeq} (전체 ${totalExists}통)`);

      const messages = this.client.fetch(`${startSeq}:${endSeq}`, {
        uid: true,
        flags: true,
        envelope: true,
        source: true
      });

      for await (const msg of messages) {
        if (!msg.source) continue;
        const parsed = await simpleParser(msg.source);

        const subject = parsed.subject || '(제목 없음)';
        const fromAddress = parsed.from?.value[0]?.address || '';
        const fromName = parsed.from?.value[0]?.name || fromAddress;

        // 광고 판별 알고리즘 실행
        const promoCheck = detectPromotionalEmail(parsed, subject, fromAddress);

        result.push({
          id: `${this.account.id}-${msg.uid}`,
          uid: msg.uid,
          accountId: this.account.id,
          subject,
          sender: { name: fromName, address: fromAddress },
          to: parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map((t: any) => t.text) : [parsed.to.text]) : [],
          date: parsed.date ? parsed.date.toLocaleDateString() : '',
          preview: (parsed.text || '').slice(0, 150).replace(/\s+/g, ' '),
          text: parsed.text,
          html: parsed.html || parsed.textAsHtml,
          isRead: msg.flags ? msg.flags.has('\\Seen') : false,
          isStarred: msg.flags ? msg.flags.has('\\Flagged') : false,
          isPromotional: promoCheck.isPromo,
          promoReason: promoCheck.reason,
          folder: 'INBOX'
        });
      }

      return {
        emails: result.reverse(),
        totalExists,
        oldestSeq: startSeq
      };
    } finally {
      lock.release();
    }
  }

  // 광고 메일 실제 서버 영구 삭제
  async deleteEmailsPermanently(uids: number[]): Promise<boolean> {
    if (!this.client) throw new Error('IMAP 클라이언트가 연결되지 않았습니다.');
    if (uids.length === 0) return true;

    const lock = await this.client.getMailboxLock('INBOX');

    try {
      await this.client.messageFlagsAdd(uids.join(','), ['\\Deleted'], { uid: true });
      await this.client.messageDelete(uids.join(','), { uid: true });
      return true;
    } catch (err) {
      console.error('[IMAP Expunge Error]:', err);
      throw err;
    } finally {
      lock.release();
    }
  }

  // 실제 서버에 폴더(Mailbox) 생성
  async createFolder(folderName: string): Promise<boolean> {
    if (!this.client) throw new Error('IMAP 클라이언트가 연결되지 않았습니다.');
    try {
      console.log(`[IMAP] ${this.account.email} 서버에 폴더 "${folderName}" 생성 시도...`);
      await this.client.mailboxCreate(folderName);
      console.log(`[IMAP] 폴더 "${folderName}" 생성 성공!`);
      return true;
    } catch (err: any) {
      // 이미 존재하는 폴더인 경우도 정상 처리
      if (err.message && err.message.includes('ALREADYEXISTS')) {
        return true;
      }
      console.error(`[IMAP Create Folder Error]:`, err);
      throw err;
    }
  }

  // 실제 서버에서 메일을 특정 폴더로 이동 (UID MOVE)
  async moveEmail(uid: number, targetFolderName: string, sourceFolder: string = 'INBOX'): Promise<boolean> {
    if (!this.client) throw new Error('IMAP 클라이언트가 연결되지 않았습니다.');
    const lock = await this.client.getMailboxLock(sourceFolder);
    try {
      console.log(`[IMAP] 메일 UID ${uid}를 "${sourceFolder}" -> "${targetFolderName}"(으)로 이동...`);
      await this.client.messageMove(uid.toString(), targetFolderName, { uid: true });
      console.log(`[IMAP] 메일 이동 완료!`);
      return true;
    } catch (err) {
      console.error(`[IMAP Move Email Error]:`, err);
      throw err;
    } finally {
      lock.release();
    }
  }

  // 연결 해제
  async disconnect() {
    if (this.client) {
      await this.client.logout();
      this.client = null;
    }
  }
}
