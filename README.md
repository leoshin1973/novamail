# NOVAMAIL

> **Developed by NOVATECHSTUDIO**  
> 지메일(Gmail)과 네이버 메일(Naver Mail)을 간편하게 연동하고, 복잡한 기능 없이 깔끔한 macOS 스타일 인터페이스와 스마트 광고/프로모션 자동 분류 및 서버 영구 삭제 동기화를 제공하는 윈도우용 데스크톱 이메일 클라이언트입니다.

---

## 🌟 주요 특징

1. **감각적인 macOS 인터페이스**
   - 윈도우 기본 창틀을 제거하고 좌측 상단 **macOS 신호등 버튼 (빨/노/초)** 적용
   - 정갈한 3단 컬럼 레이아웃: **사이드바(계정/스마트함) - 메일 목록 - 리딩 뷰어**
   - Pretendard & Inter 기반의 미려한 타이포그래피 및 Glassmorphism 효과

2. **4가지 프리미엄 디자인 테마**
   - 🌙 **macOS Dark**: 깊고 우아한 딥 다크 모드
   - ☀️ **macOS Light**: 눈부시지 않고 정갈한 스노우 화이트
   - 🌊 **Nordic Slate**: 차분하고 세련된 차콜 블루 톤
   - 📜 **Warm Paper**: 눈의 피로를 덜어주는 미색/아이보리 서재 톤

3. **스마트 광고/홍보 메일 자동 분류 & 실제 서버 삭제 동기화**
   - 한국 광고 법적 규정 표기 `(광고)`, `[광고]` 자동 감지
   - 뉴스레터 및 대량 발송 표준 헤더(`List-Unsubscribe`, `Precedence: bulk`) 정밀 분석
   - **'광고 메일 모두 비우기'** 클릭 시, 로컬뿐만 아니라 **구글/네이버 IMAP 서버에서도 영구 삭제(`EXPUNGE`)**되어 원본 메일함이 깔끔하게 정리됩니다.

4. **지메일 & 네이버 메일 간편 등록**
   - IMAP/SMTP 포트와 호스트를 자동 설정하는 원클릭 프리셋 지원

---

## 🚀 빠른 시작 방법

### 1. 패키지 설치
터미널을 열고 의존성을 설치합니다:
```bash
npm install
```

### 2. 개발 모드 실행
```bash
npm run dev
```

---

## 🔐 계정 연동 가이드

### 1) 네이버 메일 (Naver Mail)
1. 네이버 메일 접속 > 좌측 하단 **환경설정(톱니바퀴)** 클릭
2. **[POP3/IMAP 설정]** 메뉴 선택
3. **[IMAP/SMTP 설정]** 탭에서 **'IMAP/SMTP 정상'**으로 사용 설정 켬
4. 네이버 계정 2단계 인증을 사용 중인 경우, **네이버 로그인 > 내정보 > 보안설정 > 2단계 인증 [애플리케이션 비밀번호 관리]**에서 생성된 전용 비밀번호를 입력합니다.

### 2) 구글 지메일 (Google Gmail)
1. [Google 계정 보안 페이지](https://myaccount.google.com/security) 접속
2. **2단계 인증**이 활성화되어 있는지 확인
3. **[앱 비밀번호]** 검색 후 진입하여 '메일'용 앱 비밀번호(16자리)를 발급받아 입력합니다.

---

## 📁 주요 디렉토리 구조

```
├── electron/
│   ├── main.ts         # 프레임리스 윈도우 생성 및 IPC 채널 핸들러
│   ├── preload.ts      # 안전한 ContextBridge 브릿지
│   └── mailEngine.ts   # IMAPFlow 기반 네이버/구글 메일 동기화 및 영구 삭제 엔진
├── src/
│   ├── components/
│   │   ├── TitleBar.tsx      # 신호등 버튼, 검색창, 테마 선택 드롭다운
│   │   ├── Sidebar.tsx       # 계정 목록 및 스마트 폴더 (광고함 배지)
│   │   ├── MailList.tsx      # 메일 카드 목록 및 '광고 메일 모두 비우기' 배너
│   │   ├── MailViewer.tsx    # macOS Mail 감성 본문 뷰어
│   │   └── AccountModal.tsx  # 네이버/구글 계정 추가 모달
│   ├── store/
│   │   └── useMailStore.ts   # 메일 상태, 광고 판별 필터링, 테마 상태 스토어
│   ├── styles/
│   │   └── theme.css         # 4가지 테마 및 macOS 비주얼 시스템 CSS 변수
│   ├── types/
│   │   └── index.ts          # 메일 계정, 메시지, 테마 타입 정의
│   ├── App.tsx               # 최상위 레이아웃
│   └── main.tsx              # React 엔트리포인트
├── package.json
└── vite.config.ts
```
