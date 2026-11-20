# MOCCO Super Admin Design System Specification (ADMIN_DESIGN.md)

**Project:** MOCCO Admin Console (모꼬 운영 관리자 콘솔)  
**Target Environment:** Next.js 14 (React 18, Tailwind CSS, Lucide Icons)  
**Design Paradigm:** Linear / Stripe / Vercel Dashboard 스타일의 고밀도 모던 B2B SaaS 어드민  
**Status:** Canonical Super Admin Design Specification (운영 어드민 기준 명세서)  

---

## 1. Visual Theme & Philosophy (시각적 원칙 및 철학)

모꼬 운영 관리자 콘솔은 일반 사용자용 B2C 웹 포털(모꼬홈/마켓/LIVE)의 화려한 그라데이션, 네온 핑크, 라운드 카드와 달리 **"운영 생산성 극대화, 정밀한 데이터 가독성, 신속한 의사결정"**을 최우선으로 합니다.

### 1.1 B2B SaaS Core Principles (3대 핵심 원칙)
1. **Subdued Slate Palette (절제된 무채색 기반):**
   - 불필요한 장식용 그라데이션과 네온 글로우를 배제합니다.
   - 배경: `Slate-50 (#F8FAFC)`
   - 카드 및 테이블 서피스: `Pure White (#FFFFFF)`
   - 외곽선: 정교한 `1px solid Slate-200 (#E2E8F0)`
2. **High-Contrast Semantic Status (직관적인 상태 뱃지 시스템):**
   - 운영자가 수천 건의 데이터 중 위험 요소나 미처리 건을 즉시 식별할 수 있도록, 4가지 표준 의미론적 상태(Semantic Status)를 엄격히 적용합니다.
3. **Information Density & Typography Discipline (고밀도 정보 계층):**
   - 불필요하게 비어 있는 여백을 줄이고, 데이터 테이블의 행 높이(`48px ~ 52px`), 헤더 대비, 콤팩트한 폰트 크기(`11px ~ 13px`)를 통해 한 화면에서 많은 운영 데이터를 비교·판단할 수 있게 합니다.
4. **Vector Icon Standard (이모지 전면 배제):**
   - 관리자 화면의 모든 메뉴, 상태 표시, 액션 버튼에서 텍스트 이모지(🚨, 🔒, 👑, ✨, 📊 등)를 완전히 제거하고 통일된 Lucide React 벡터 아이콘으로 대체합니다.

---

## 2. Color Palette & Semantic Roles (색상 체계)

### 2.1 Surfaces & Neutrals (무채색 스케일)
| 명칭 | Hex 코드 | Tailwind 클래스 | 적용 대상 |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#F8FAFC` | `bg-slate-50` | 콘솔 전체 백그라운드 |
| **Card / Surface** | `#FFFFFF` | `bg-white` | KPI 카드, 테이블 컨테이너, 모달 다이얼로그 |
| **Sub Surface** | `#F1F5F9` | `bg-slate-100` | 테이블 헤더(th), 검색창 인풋 배경, 비활성 탭 |
| **Border / Divider** | `#E2E8F0` | `border-slate-200` | 모든 카드, 테이블 테두리, 구분선 (`1px solid`) |
| **Border Subtle** | `#F1F5F9` | `border-slate-100` | 테이블 데이터 행(tr) 간 구분선 |
| **Text Primary** | `#0F172A` | `text-slate-900` | 주요 제목, KPI 수치, 사용자 닉네임, 핵심 데이터 |
| **Text Secondary** | `#334155` | `text-slate-700` | 메뉴 텍스트, 테이블 본문 텍스트 |
| **Text Muted** | `#64748B` | `text-slate-500` | 서브 레이블, 생성 일시, 단위, 가이드 텍스트 |
| **Text Placeholder** | `#94A3B8` | `text-slate-400` | 검색창 플레이스홀더, 비활성 아이콘 |

### 2.2 Semantic Status System (상태 뱃지 규격)
모든 뱃지는 `inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border` 규격을 따릅니다.

| 상태 명칭 | 뱃지 스타일 (Tailwind) | 적용 대상 |
| :--- | :--- | :--- |
| **Active / Success (정상·활성)** | `bg-emerald-50 text-emerald-700 border-emerald-200` | 정상 유저, 승인 완료, 라이브 정상 송출, 결제 완료 |
| **Warning / Review (주의·검토)** | `bg-amber-50 text-amber-700 border-amber-200` | 본인인증 대기, 미처리 신고, 검수 대기, 배송 지연 |
| **Danger / Block (위험·차단)** | `bg-rose-50 text-rose-700 border-rose-200` | 계정 영구차단, 라이브 강제종료, 신고 누적, 결제 취소 |
| **Info / Pending (정보·대기)** | `bg-sky-50 text-sky-700 border-sky-200` | 신규 접수, 정산 대기, AI 분석 중 |
| **Neutral / Inactive (비활성)** | `bg-slate-100 text-slate-600 border-slate-200` | 휴면 계정, 방송 종료, 임시 저장 |

---

## 3. Layout & Structure (레이아웃 표준 규격)

### 3.1 Sidebar Navigation (`AdminSidebar`)
- **너비:** 데스크톱 기준 `240px (w-60)` 고정.
- **배경:** `bg-slate-900` (다크) 또는 `bg-white border-r border-slate-200` (라이트).
- **메뉴 항목:**
  - 높이: `h-9 (36px)`, 라운딩 `rounded-lg`, 좌우 패딩 `px-3`
  - 비활성: `text-slate-600 hover:text-slate-900 hover:bg-slate-100`
  - 활성: `bg-slate-900 text-white font-semibold shadow-xs` (또는 `bg-slate-100 text-slate-900 font-bold`)
  - 아이콘: `w-4 h-4 mr-2.5 shrink-0`

### 3.2 Top Header Bar
- **높이:** `h-14 (56px)` 고정, 상단 `sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200`.
- **구성:**
  - 좌측: 현재 페이지 브레드크럼 (`관리자 콘솔 > 회원 관리`)
  - 우측: 실시간 시스템 상태 인디케이터 (녹색 도트), 관리자 프로필, 로그아웃 버튼.

### 3.3 Top KPI Summary Cards (상단 지표 요약)
- **그리드:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6`.
- **카드 컨테이너:** `bg-white rounded-xl border border-slate-200 p-4 shadow-xs`.
- **구성 요소:**
  - 상단: 지표 타이틀(`text-xs font-medium text-slate-500`) + 우측 미니 아이콘
  - 중앙: 메인 수치(`text-2xl font-extrabold text-slate-900 tracking-tight font-mono`)
  - 하단: 전일/전주 대비 증감 배지 (`text-[11px] font-semibold text-emerald-600 flex items-center gap-1`)

### 3.4 Data Table Standards (데이터 테이블 규격)
- **컨테이너:** `bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs`.
- **테이블 헤더 (`thead tr`):**
  - 높이: `h-10 (40px)`
  - 배경: `bg-slate-50 border-b border-slate-200`
  - 텍스트: `text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-left px-4 py-2`
- **데이터 행 (`tbody tr`):**
  - 높이: `h-13 (52px)`
  - 배경: `hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0`
  - 패딩: `px-4 py-3`
  - 텍스트: `text-xs sm:text-sm text-slate-800`
- **조작 바 (Filter / Search Bar):**
  - 상단에 배치: 검색창(`h-9 text-xs bg-slate-50 border-slate-200 rounded-lg`), 상태 필터 드롭다운, 엑셀 다운로드 버튼.

---

## 4. Modal & Drawer Guidelines (모달 및 상세 창 규격)

- **백드롭:** `fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4`.
- **다이얼로그:** `bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4`.
- **헤더:** 타이틀 `text-base font-bold text-slate-900` + 우측 닫기(`X`) 버튼.
- **액션 푸터:**
  - `flex items-center justify-end gap-2 pt-4 border-t border-slate-100`
  - 취소: `h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50`
  - 확인/제재: `h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold` (위험 작업 시 `bg-rose-600 hover:bg-rose-700`)
