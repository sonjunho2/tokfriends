# 다가온 (DAGAON) 본서버 실서비스 이전 및 서버별 셋팅 가이드

> **문서 버전:** 1.0.0  
> **최종 수정일:** 2026-10-15  
> **적용 스택:** GitHub · Supabase (PostgreSQL / Storage) · Render (API 백엔드) · Vercel (관리자 콘솔) · 모바일(Expo/React Native)

---

## 1. 실서비스 이전 아키텍처 개요

다가온(DAGAON)은 개발자 계정에서 **사업자(운영사) 명의의 서버 계정**으로 이전할 때, 소스 코드 재빌드 없이 **환경변수 및 관리자 콘솔의 외부 연동 관리**를 통해 즉시 무중단 전환되도록 설계되었습니다.

```mermaid
flowchart TD
    subgraph 사업자_클라우드_인프라
        GH[GitHub 사업자 저장소] -->|자동 배포| RNDR[Render API 백엔드]
        GH -->|자동 배포| VCL[Vercel 관리자 콘솔 웹]
        
        RNDR <-->|PostgreSQL DB| SUPA_DB[(Supabase DB)]
        RNDR <-->|채증/프로필 파일| SUPA_ST[(Supabase Storage)]
        VCL <-->|Proxy /v1| RNDR
    end

    subgraph 외부_사업자_연동
        RNDR <--> KAKAO[카카오/네이버/구글/애플 OAuth]
        RNDR <--> TOSS[토스페이먼츠 / 포트원 PG]
        RNDR <--> FCM[Firebase FCM & Apple APNs]
        RNDR <--> AGORA[Agora RTC & CDN HLS]
        RNDR <--> GEMINI[Google Gemini AI 직원]
    end
```

---

## 2. 1단계: GitHub 사업자 계정 설정

1. **사업자 GitHub 계정 로그인 & 저장소 생성**:
   - 사업자 GitHub 조직(Organization) 또는 대표 계정에 신규 Private Repository `dagaon-core` (또는 `tokfriends`)를 생성합니다.
2. **코드 푸시 (미러링)**:
   ```bash
   # 원격 저장소 추가 후 main 브랜치 푸시
   git remote add production https://github.com/<사업자계정>/dagaon-core.git
   git push -u production main
   ```
3. **보안 브랜치 보호 규칙**:
   - `Settings` > `Branches` > `main` 브랜치에 대해 `Require a pull request before merging` 설정 권장.

---

## 3. 2단계: Supabase 사업자 프로젝트 설정 (Database & Storage)

1. **Supabase 프로젝트 생성**:
   - [Supabase Dashboard](https://supabase.com/dashboard)에서 `New Project` 클릭.
   - **Name**: `dagaon-prod`
   - **Region**: `Seoul (ap-northeast-2)` (한국 리전 선택 필수)
   - **Database Password**: 강력한 비밀번호 설정 후 별도 기록.
2. **연결 문자열(Connection String) 확인**:
   - `Project Settings` > `Database` > `Connection String`에서 URI 복사:
     - **Session Pooler (Port 5432)**: `DATABASE_URL`로 사용
     - **Direct Connection (Port 5432)**: `DIRECT_URL`로 사용
3. **스토리지 버킷(Storage Buckets) 생성**:
   - `Storage` 메뉴에서 아래 3개의 버킷을 생성합니다:
     - `snapshots` (라이브/영상통화 실시간 채증용, Public 해제 권장)
     - `avatars` (회원 프로필 사진, Public)
     - `chat_media` (1:1 대화 사진/미디어, Private)
4. **API 키 확인**:
   - `Project Settings` > `API`에서:
     - **Project URL**: `https://<project-ref>.supabase.co`
     - **service_role (secret)**: 관리자 비공개 키 (API 백엔드용)
5. **데이터베이스 스키마 마이그레이션**:
   ```bash
   cd services/api
   # .env 파일에 신규 Supabase DATABASE_URL 설정 후 스키마 동기화 실행
   npx prisma db push
   ```

---

## 4. 3단계: Render API 백엔드 Web Service 설정

1. **Render Web Service 생성**:
   - [Render Dashboard](https://dashboard.render.com) > `New` > `Web Service`
   - 사업자 GitHub 저장소 `dagaon-core` 연결.
2. **빌드 및 실행 설정**:
   - **Name**: `dagaon-api`
   - **Region**: `Singapore` 또는 인접 리전
   - **Branch**: `main`
   - **Root Directory**: `services/api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `node dist/main.js`
   - **Plan**: `Starter` ($7/월 이상, 실서비스 권장)
   - **Health Check Path**: `/v1/health`
3. **환경변수 (Environment Variables) 등록**:
   관리자 웹 화면(`시스템 설정` > `실서비스 외부 연동 관리`)에서 **[.env.production 복사]** 버튼을 누른 후 붙여넣거나, 아래 핵심 변수를 등록합니다:
   ```env
   NODE_ENV=production
   PORT=4000
   API_PREFIX=v1
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   JWT_SECRET=당신만의_강력한_64자리_랜덤_시크릿
   JWT_EXPIRES_IN=7d
   ADMIN_SETTINGS_ENCRYPTION_KEY=관리자_AES_암호화_32바이트_키
   SUPABASE_URL=https://[REF].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1Ni...
   CORS_ORIGIN=https://admin.dagaon.app,https://api.dagaon.app
   ```

---

## 5. 4단계: Vercel 관리자 콘솔 웹(Admin) 설정

1. **Vercel 프로젝트 가져오기**:
   - [Vercel Dashboard](https://vercel.com) > `Add New...` > `Project`
   - 사업자 GitHub 저장소 연결.
2. **프로젝트 설정**:
   - **Project Name**: `dagaon-admin`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/admin` (반드시 `apps/admin` 지정)
3. **환경변수 설정**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://dagaon-api.onrender.com/v1
   TOK_API_BASE_URL=https://dagaon-api.onrender.com
   ```
4. **도메인 연결**:
   - `Settings` > `Domains`에서 사업자 공식 도메인 (예: `admin.dagaon.app`) 등록 및 DNS CNAME 연결.

---

## 6. 5단계: 관리자 콘솔에서 사업자 외부 연동 키 입력 및 연동

새로 배포된 관리자 콘솔(`https://admin.dagaon.app/settings`)에 로그인 후:

1. **[⚙️ 시스템 설정] > [실서비스 외부 연동 관리]** 접속.
2. 상시 렌더링 폼에 사업자 명의로 발급받은 실제 키들을 입력합니다:
   - **1. 소셜 로그인**: 카카오, 네이버, 구글, 애플 Client ID 및 Secret
   - **2. 결제/PG**: 토스페이먼츠(live_ck/live_sk), 포트원 Store ID/API Key
   - **3. 실시간 푸시**: Firebase 비공개 키 JSON 전체, Apple APNs AuthKey (.p8)
   - **4. 실시간 스트리밍**: Agora App ID, Primary Certificate, 송출 방식(Agora RTC / CDN HLS)
   - **5. AI 직원 & 스토리지**: Google Gemini API Key, Supabase URL / Key
3. **[모든 변경사항 즉시 저장]** 클릭:
   - 금융급 암호화(AES-256-GCM)로 DB에 저장되며, 백엔드는 재시작 없이 런타임에 즉시 이 키들을 읽어 동작합니다.
4. **[📋 .env.production 복사] 또는 [💾 .env 파일 다운로드]**:
   - 서버 레벨에서 환경변수로 고정하고 싶을 때 즉시 다운로드하여 사용할 수 있습니다.

---

## 7. 6단계: 외부 개발자 콘솔의 Callback URL 최종 확인

사업자 계정 전환 후 각 서비스 콘솔에 등록해야 할 콜백 주소 목록입니다:

| 서비스 | 설정 메뉴 | 등록할 주소 |
| :--- | :--- | :--- |
| **카카오 디벨로퍼스** | 카카오 로그인 > Redirect URI | `https://dagaon-api.onrender.com/v1/auth/kakao/callback` |
| **네이버 디벨로퍼스** | 로그인 오픈 API 서비스 환경 > Callback URL | `https://dagaon-api.onrender.com/v1/auth/naver/callback` |
| **Google Cloud Console** | 사용자 인증 정보 > 승인된 리디렉션 URI | `https://dagaon-api.onrender.com/v1/auth/google/callback` |
| **Apple Developer** | Identifiers > Service IDs > Sign in with Apple | `https://dagaon-api.onrender.com/v1/auth/apple/callback` |
| **토스페이먼츠 콘솔** | 개발 정보 > 웹훅 (Webhook) URL | `https://dagaon-api.onrender.com/v1/store/webhook/toss` |
| **포트원 콘솔** | 결제 연동 > Webhook URL | `https://dagaon-api.onrender.com/v1/store/webhook/portone` |
| **Agora 콘솔** | Cloud Recording > Storage Settings | Supabase S3 Compatible 스토리지 정보 연결 |

이것으로 본서버 이전 및 사업자 계정 세팅이 안전하고 완벽하게 마무리됩니다.
