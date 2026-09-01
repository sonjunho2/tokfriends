딱친(TokFriends) 서비스를 위한 웹 기반 관리자 패널입니다.

## 주요 기능

- 🔐 **관리자 인증 및 RBAC 권한 관리**
- 👥 **사용자 관리** (조회, 제재, 상태 변경)
- 📊 **대시보드** (핵심 지표, 트렌드 차트)
- 🚨 **신고 관리** (처리, 상태 변경, 담당자 배정)
- 🛡️ **금칙어 관리** (CRUD, CSV 일괄 처리)
- 📢 **공지사항 관리** (생성, 수정, 활성화)
- 📝 **감사 로그** (모든 관리 활동 추적)
- 🌓 **다크/라이트 모드**

## TokFriends 앱 API 연동 지침

모바일 앱과 동일한 백엔드(`tok-friends` API)를 사용하도록 관리자 콘솔을 설계할 때 따라야 할 핵심 원칙입니다.

1. **레포 구조**: 현재 저장소는 모바일 앱과 분리된 관리자 전용 패키지입니다. 필요한 경우 모노레포로 확장하되, 웹/앱 관리 도구는 별도 패키지로 유지합니다.
2. **인증 흐름**: 로그인 시 모바일 앱과 동일한 `POST /auth/login/email` 엔드포인트를 사용하여 `access_token`을 저장하고, 토큰 만료(401) 시 재로그인을 요구합니다. 【F:admin-web/src/lib/api.ts†L132-L214】【F:admin-web/src/app/login/page.tsx†L15-L113】
3. **핵심 기능 대응 API**:
   - 사용자 목록/검색, 상세 조회, 프로필 수정은 각각 `GET /users/search`, `GET /users/:id`, `PATCH /users/:id`를 이용합니다. 이메일·닉네임 필터를 UI에서 제공합니다. 【F:admin-web/src/lib/api.ts†L216-L303】【F:admin-web/src/app/users/page.tsx†L17-L263】
   - 신고·차단 처리는 `POST /community/report`, `POST /community/block`를 사용하며, 목록 조회가 필요하면 백엔드 확장을 요청합니다. 【F:admin-web/src/lib/api.ts†L305-L329】
   - 토픽/게시글 운영은 `/topics`, `/topics/:id/posts`, `/posts` 계열 API로 승인·삭제 플로우를 만듭니다. 【F:admin-web/src/lib/api.ts†L331-L377】
   - 공지·배너는 `GET /announcements/active`, `GET /announcements?isActive=true`를 우선 사용하고, 생성·비활성화가 필요하면 추가 엔드포인트를 정의합니다. 【F:admin-web/src/lib/api.ts†L379-L439】【F:admin-web/src/app/content/page.tsx†L18-L391】
   - 선물/아이템은 `GET /gifts` 응답(404 시 빈 배열)을 기반으로 목록을 구성하고, 필요한 CRUD 엔드포인트를 정의합니다. 【F:admin-web/src/lib/api.ts†L441-L482】
4. **운영 수칙**: 관리자 UI 역시 `NEXT_PUBLIC_API_BASE_URL` 환경변수로 API 베이스를 설정하고, 배포 전 `/health` 체크와 토큰 만료 시나리오 QA를 수행합니다. 주요 지표 시각화가 필요하면 백엔드에 통계 엔드포인트를 명시적으로 요청합니다. 【F:admin-web/src/lib/api.ts†L25-L129】【F:admin-web/src/app/login/page.tsx†L24-L53】


## 환경변수 및 보안 주의

- `NEXT_PUBLIC_API_BASE_URL`: 관리자 콘솔이 호출할 백엔드 API의 기본 URL입니다. `.env.example`을 복사해 `.env`를 만들고 배포 환경에서는 플랫폼의 환경변수 설정에 값을 입력하세요.
- 민감한 토큰·키·엔드포인트는 Git에 커밋하지 말고 환경변수로만 관리하세요. 레포에서 하드코딩된 값이 보이면 즉시 제거하고 TODO 주석을 확인하세요.
- 로컬에서는 `.env` 파일을 `.gitignore`로 보호하고, 공유 저장소에 업로드하지 마세요.

위 원칙을 지키면 `src/lib/api.ts`의 TODO 경고 없이 안전하게 API를 호출할 수 있습니다.

## 기술 스택

- **API (tok‑friends)** : NestJS 10, Prisma ORM, PostgreSQL, JWT 인증, Swagger 문서화
- **Frontend (admin‑web)** : Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui 컴포넌트, Recharts

## 설치 및 실행

### 사전 요구사항

- Node.js 20.x
- PostgresQL (또는 Neon 계정)
- Git

### 로컬 개발 환경 설정

1. **프로젝트 복제**

   ```bash
   git clone [repository-url]
   cd tokfriends-admin

2. Frontend (admin‑web) 설정

cd admin-web

# 환경변수 설정
cp .env.example .env

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

3. 접속

Frontend : http://localhost:3000

Backend API : http://localhost:4000

Swagger 문서 : http://localhost:4000/docs

Render 배포 가이드

admin‑web 배포

Render 대시보드에서 “New Static Site” 또는 “New Web Service”를 생성합니다. GitHub 저장소를 연결하고 다음과 같이 설정합니다.

Name : tokfriends-admin-web

Root Directory : admin-web

Environment : Node

Build Command : npm ci && npm run build

Start Command : npm run start

환경변수 추가 :

NEXT_PUBLIC_API_BASE_URL : tok‑friends API의 URL

초기 로그인

처음 실행 시 기본 관리자 계정이 생성됩니다. 아래 계정으로 로그인한 뒤 비밀번호를 즉시 변경하세요.

이메일 : admin@local

비밀번호 : Admin123!

주요 기능 사용법
사용자 관리

1.좌측 메뉴에서 “사용자 관리”를 클릭합니다.

2.이메일 또는 닉네임으로 검색할 수 있습니다.

3.사용자 행 우측의 “정지” 버튼을 클릭하여 제재하거나, 정지된 사용자는 “활성화” 버튼으로 복구할 수 있습니다.

신고 관리

1.좌측 메뉴에서 “신고 관리”를 클릭합니다.

2.상태 필터(대기중/처리완료/반려)를 선택합니다.

3.각 신고에 대해 “처리완료” 또는 “반려” 버튼을 클릭합니다.

금칙어 관리

1.좌측 메뉴에서 “금칙어 관리”를 클릭합니다.

2.우측 상단의 “금칙어 추가” 버튼으로 새로운 금칙어를 추가합니다.

3.각 금칙어의 심각도(LOW/MEDIUM/HIGH)를 선택합니다.

4.CSV 업로드/다운로드를 지원합니다.

공지사항 관리

1.좌측 메뉴에서 “공지사항”을 클릭합니다.

2.우측 상단의 “공지사항 추가” 버튼으로 새 공지를 작성합니다.

3.토글 스위치로 공지를 활성/비활성화할 수 있습니다.

문제 해결
데이터베이스 연결 오류

1.DATABASE_URL이 올바른지 확인합니다.

2.PostgresQL 서버가 실행 중인지 확인합니다.

3.SSL 설정이 필요한 경우 연결 문자열 끝에 ?sslmode=require를 추가합니다.

CORS 오류

1.tok‑friends API의 CORS_ORIGIN 환경변수를 확인합니다.

2.Frontend URL이 정확하게 지정되었는지 확인합니다.

인증 오류

1.JWT 토큰이 만료되었는지 확인합니다.

2.로그아웃 후 다시 로그인합니다.

라이선스

MIT License

지원

문제가 발생하면 Issue를 생성하거나 관리자에게 문의하세요.
