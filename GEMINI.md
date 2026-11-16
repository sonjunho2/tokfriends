# MOCCO (모꼬) 워크스페이스 개발 및 동기화 표준 규칙 (GEMINI.md)

본 문서는 **MOCCO (모꼬)** 멀티 플랫폼 프로젝트의 백엔드(`services/api`), 관리자 및 웹(`apps/admin`), 모바일 앱(`apps/mobile`), 그리고 인터페이스 계약(`contracts/`)이 항상 동일한 비즈니스 로직과 데이터 스펙을 유지하도록 강제하는 **워크스페이스 표준 작업 규칙**입니다.

새로운 기능 추가, 데이터 모델 변경, 또는 버그 수정 시 모든 작업자는 아래의 **5대 핵심 원칙**을 엄격히 준수해야 합니다.

---

## 📌 5대 핵심 개발 및 동기화 원칙

### 1. 단일 진실 공급원 (Single Source of Truth, SSOT) 원칙
- 데이터 모델, 스키마, 또는 비즈니스 로직의 기준은 항상 **백엔드 DB 스키마와 DTO**입니다.
- 모델이나 API 스펙이 변경될 경우 반드시 다음 순서로 작업을 시작합니다:
  1. `services/api/prisma/schema.prisma` 수정 및 마이그레이션 (`npx prisma migrate` or `prisma db push`)
  2. `services/api/src/modules/**/dto/*.dto.ts`에 유효성 검사 데코레이터(`class-validator`)와 함께 DTO 수정
  3. `services/api/src/modules/**/*.controller.ts` 및 `*.service.ts` 비즈니스 로직 구현
- 백엔드 DTO에 정의되지 않은 비표준 필드는 `ValidationPipe({ forbidNonWhitelisted: true })`에 의해 차단되므로, 임의로 클라이언트에서 필드를 만들어 전송하지 않습니다.

### 2. Contracts 명세 동기화 (Contract Synchronization)
- 백엔드의 엔드포인트(URL, HTTP Method, Request Body, Response 구조)가 변경되거나 추가/삭제되면 API 계약 명세서를 즉시 갱신합니다.
- 동기화 대상 파일:
  - `contracts/api/build_contract.py`: 엔드포인트 및 DTO 스키마 명세 업데이트
  - `contracts/api/openapi.yaml`: 최신 OpenAPI 3.0 명세 반영
  - `contracts/admin/openapi.yaml` 및 `contracts/mobile/openapi.yaml`: 클라이언트별 사용 엔드포인트 동기화
- 백엔드 수정 후 계약 명세가 구버전으로 방치되지 않도록 커밋 전 검증을 필수로 수행합니다.

### 3. 전 영역 연쇄 수정 필수 (3-Way Cascade Sync)
API나 데이터 구조가 변경될 때 특정 플랫폼(웹만 수정하거나 앱만 수정)만 수정하는 행위를 금지하며, 아래 **3개 영역의 모든 연관 파일**을 한 번에 동시 수정합니다:
1. **`services/api` (백엔드)**:
   - Prisma 스키마, NestJS DTO, Controller, Service
2. **`apps/admin` (Next.js 웹 & 관리자)**:
   - `src/lib/routeMap.ts` (라우트 매핑 키 및 실제 경로)
   - `src/lib/api.ts` (API 호출 함수 및 에러 핸들링)
   - `src/lib/normalize.ts` (응답 데이터 표준화 함수)
   - `src/app/web/` (일반 유저용 웹 화면 - 친구들, 전체수다, 채팅 등)
   - `src/app/admin/` (슈퍼어드민/셀러 관리자 콘솔 화면)
3. **`apps/mobile` (React Native / Expo 앱)**:
   - `src/api/routeMap.js` (경로 재작성 및 `/v1` 프리픽스 보장)
   - `src/api/client.js` (모바일 API 클라이언트)
   - `src/api/normalize.js` (모바일 응답 정규화)
   - `src/screens/` 및 `src/services/` (모바일 화면 및 비즈니스 서비스)

### 4. 환경 변수 및 엔드포인트 일관성 (Environment & URL Consistency)
- `apps/admin`과 `apps/mobile`이 바라보는 백엔드 서버 URL 및 프리픽스 규칙을 항상 일치시킵니다.
  - 실서버 백엔드 기준 URL: `https://tok-friends-api.onrender.com`
  - 전역 API 프리픽스: `/v1` (예: `https://tok-friends-api.onrender.com/v1/...`)
- **라우트 매핑 일관성**:
  - `apps/admin/src/lib/routeMap.ts`와 `apps/mobile/src/api/routeMap.js`에 등록된 엔드포인트가 백엔드 컨트롤러와 정확히 1:1 대응해야 합니다.
  - 클라이언트가 임의의 레거시 경로(예: `/auth/otp/request`)를 호출하지 않도록 정규 엔드포인트(`/auth/phone/request-otp`)로 통일합니다.

### 5. 작업 완료 보고 표준 (Standard 4-Step Checklist)
모든 기능 개발, 버그 수정, 스키마 변경 작업 완료 시 아래의 **4개 영역 동기화 체크리스트**를 작성하여 보고합니다.

```markdown
### 📋 [동기화 검증 보고서]
- [ ] **1. DB & API (`services/api`)**:
  - [x] Prisma Schema / DTO 수정 완료
  - [x] NestJS Controller & Service 구현 및 테스트 완료
- [ ] **2. Contracts (`contracts/`)**:
  - [x] `contracts/api/build_contract.py` 스키마 반영
  - [x] `openapi.yaml` 최신화 완료
- [ ] **3. Admin & Web (`apps/admin`)**:
  - [x] `routeMap.ts` 및 `api.ts` / `normalize.ts` 수정 완료
  - [x] 유저 웹(`src/app/web`) 및 관리자 화면 연동 검증
- [ ] **4. Mobile App (`apps/mobile`)**:
  - [x] `routeMap.js` 및 `client.js` / `normalize.js` 수정 완료
  - [x] 모바일 스크린 UI 연동 및 빌드/동작 검증
```

---

## 🔍 현재 모노레포 구조 진단 및 불일치/중복 스캔 리포트

워크스페이스 전체 스캔 결과, 현재 발견된 불일치 및 레거시 요소는 다음과 같으며 순차적으로 정비해야 합니다:

### 1. Contracts 명세의 최신화 지연 (Discrepancy)
- **현상**: `contracts/api/openapi.yaml`이 초기 버전 상태(2026-09 기준)로 고정되어 있어 최근 추가된 전체수다(`/v1/suda/posts`), 3D 선물 전송(`/v1/chats/gift`), 모꼬꿀떡 재화 환전 API 등이 누락되어 있음.
- **해결 방안**: `services/api`에 실제 라우팅된 엔드포인트들을 `contracts/api/build_contract.py`에 추가하고 재생성하여 동기화할 것.

### 2. 엔드포인트 라우팅 및 호출 방식의 이원화 (Duplication)
- **현상**:
  - `apps/admin`: Next.js API 라우트 프록시(`/api/backend/[...path]`)를 우선 경유하며, 실패 시 `onrender.com/v1`으로 fallback 호출.
  - `apps/mobile`: `routeMap.js`의 `applyRouteMapToAxiosConfig` 인터셉터를 통해 클라이언트 레벨에서 직접 `/v1` 프리픽스를 붙여 직통 호출.
- **주의점**: 엔드포인트를 변경할 때 Admin의 프록시 설정(`apps/admin/src/app/api/backend/route.ts`)과 Mobile의 `PATH_MAP` 모두에 반영해야 통신 단절이 발생하지 않음.

### 3. 필드명 및 DTO 네이밍 미세 차이 (Normalization Overhead)
- **현상**:
  - 방 카테고리/지역: 웹과 DB는 `category`, `neighborhood`를 기대하나, 모바일 일부 목업에서는 `topic`, `region`을 사용하는 경우 존재.
  - 재화 단위: `pricePoints` vs `amount` / `pointsBalance` vs `honeyBreadPoints`.
- **해결 방안**: 양쪽 클라이언트의 `normalize.ts`와 `normalize.js`에서 상호 변환 fallback을 유지하되, 장기적으로 백엔드 Prisma 모델 필드명(SSOT)으로 통일.

### 4. 슈퍼어드민 계정 노출 및 재화 차감 분리
- **현상**: 친구 목록 및 채팅방에서 슈퍼어드민(관리자)이 일반 사용자로 노출되거나, 선물 전송 시 발신자 지갑이 아닌 관리자 지갑이 참조되는 문제.
- **원칙**:
  - `role === 'SUPER_ADMIN'`인 계정은 일반 사용자 친구 목록 및 추천 목록에서 필터링(`exclude`).
  - 재화(꿀떡) 차감 시 반드시 현재 로그인된 세션 사용자(`req.user.id`)의 계좌에서 차감되도록 트랜잭션 격리 보장.

---

## 🛠 플랫폼별 주요 핵심 경로 및 파일 안내

| 플랫폼/영역 | 역할 | 핵심 파일 경로 |
| :--- | :--- | :--- |
| **Backend** | Prisma DB 스키마 | `services/api/prisma/schema.prisma` |
| | API 라우트 컨트롤러 | `services/api/src/modules/**/*.controller.ts` |
| | DTO 및 유효성 검사 | `services/api/src/modules/**/dto/*.dto.ts` |
| **Contracts** | OpenAPI 명세 및 빌더 | `contracts/api/build_contract.py`, `openapi.yaml` |
| **Admin & Web** | 라우트 매핑 테이블 | `apps/admin/src/lib/routeMap.ts` |
| | API 클라이언트 & 정규화 | `apps/admin/src/lib/api.ts`, `normalize.ts` |
| | 유저 웹 포털 | `apps/admin/src/app/web/` (`friends`, `suda`, `chat` 등) |
| | 관리자 콘솔 | `apps/admin/src/app/admin/` |
| **Mobile App** | 라우트 매핑 인터셉터 | `apps/mobile/src/api/routeMap.js` |
| | API 클라이언트 & 정규화 | `apps/mobile/src/api/client.js`, `normalize.js` |
| | 모바일 화면 | `apps/mobile/src/screens/` |
| | 소켓 및 서비스 | `apps/mobile/src/services/` |

---
*모든 새로운 기능과 버그 패치는 위 원칙에 따라 DB/API, Contracts, Admin/Web, Mobile의 동기화를 일괄 적용한 후 완료 보고를 수행하십시오.*
