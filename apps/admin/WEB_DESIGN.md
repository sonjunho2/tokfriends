# MOCCO Web Portal Design System Specification (WEB_DESIGN.md)

**Project:** MOCCO Web Portal (모꼬 일반 사용자용 웹 포털)  
**Target Environment:** Next.js 14 (React 18, Tailwind CSS, Lucide Icons)  
**Status:** Canonical Web Design System Specification (기준 명세서)  
**Parent System:** `apps/mobile/DESIGN.md` 계승 및 데스크톱/반응형 웹 확장  

---

## 1. Visual Theme & Web Aesthetic (웹 시각적 정체성 및 원칙)

MOCCO(모꼬) 웹 포털은 모바일 앱의 핵심 아이덴티티인 **"동네 이웃 간의 실시간 소통 + 생생한 라이브 커머스 + 안심 에스크로 마켓"**을 와이드스크린 데스크톱 및 모바일 웹 브라우저 환경에 최적화하여 구현합니다.

### 1.1 Web Aesthetic Principles (웹 UI 3대 원칙)
1. **Commercial Trust & Precision (당근마켓/무신사 수준의 정갈한 상용 커머스 UI):**
   - AI 생성물 특유의 과도한 보라/핑크 네온 그라데이션, 두꺼운 블러 그림자, 무분별한 이모지 장식을 완전히 제거합니다.
   - 단정한 1px Slate 보더(`border-slate-200 / border-slate-100`), 선명한 콘트라스트의 서피스(`bg-white` vs `bg-slate-50`), 정교한 그리드 시스템을 통해 금융·결제 레벨의 신뢰도를 제공합니다.
2. **Cohesive Cross-Platform Identity (모바일 앱과 100% 동일한 브랜드 경험):**
   - 모바일 앱의 대표 컬러인 **Neon Coral Pink (`#FF3B6B`)**를 핵심 브랜드 포인트 및 인터랙션 액센트로 일관되게 사용합니다.
   - 모바일 앱에서 정립된 카테고리 3대 분류(**중고거래 / 마켓상품 / 공동구매**)와 5대 메인 네비게이션 탭(**모꼬홈 / 모꼬마켓 / 모꼬LIVE / 모꼬챗 / 마이모꼬**)의 명칭과 구조를 웹에서도 완벽히 동기화합니다.
3. **Responsive Ergonomics (반응형 최적화):**
   - 데스크톱(1280px+), 태블릿(768px~1024px), 모바일 웹(<768px)에 걸쳐 카드 그리드(4열 -> 3열 -> 2열)와 헤더/내비게이션이 자연스럽게 스케일링됩니다.

---

## 2. Color System (웹 컬러 팔레트 & Tailwind 매핑)

모든 스타일링은 모바일 `tokens.colors`와 일치하도록 Tailwind CSS 클래스 및 인라인 변수로 매핑합니다.

### 2.1 Brand Accents (브랜드 핵심 색상)
| 색상 명칭 | Hex 코드 | Tailwind 클래스 대응 | 적용 대상 |
| :--- | :--- | :--- | :--- |
| **Primary Pink** | `#FF3B6B` | `text-[#FF3B6B]`, `bg-[#FF3B6B]`, `border-[#FF3B6B]` | 핵심 CTA 버튼, 활성 탭 인디케이터, 라이브 온에어 뱃지, 찜 하트 |
| **Primary Hover** | `#E02956` | `hover:bg-[#E02956]` | Primary 버튼 호버 피드백 |
| **Soft Pink Tint** | `#FFF0F5` / `#FFEBF0` | `bg-pink-50`, `bg-[#FFF0F5]` | 서브 뱃지 배경, 틴트 버튼, 활성 탭 배경 |
| **Live Secondary** | `#8B5CF6` | `text-violet-500`, `bg-violet-500` | 실시간 라이브 연계 뱃지, VIP 스트리머 마크 |

### 2.2 Neutral Scales (무채색 스케일)
| 색상 명칭 | Hex 코드 | Tailwind 클래스 대응 | 적용 대상 |
| :--- | :--- | :--- | :--- |
| **Slate 900** | `#0F172A` | `text-slate-900` | 헤드라인, 메인 타이틀, 상품명, 가격 숫자 |
| **Slate 700** | `#334155` | `text-slate-700` | 네비게이션 메뉴, 중요 본문, 판매자 닉네임 |
| **Slate 500** | `#64748B` | `text-slate-500` | 서브 텍스트, 등록 시간, 위치 정보, 카테고리 |
| **Slate 400** | `#94A3B8` | `text-slate-400` | 플레이스홀더, 비활성 아이콘, 보조 캡션 |
| **Slate 200** | `#E2E8F0` | `border-slate-200` | 1px 카드 테두리, 구분선, 모달 보더 |
| **Slate 100** | `#F1F5F9` | `bg-slate-100`, `border-slate-100` | 검색창 인풋 배경, 서브 세그먼트 바 배경 |
| **Slate 50** | `#F8FAFC` | `bg-slate-50` | 웹 페이지 전체 기본 캔버스 배경 |
| **Pure White** | `#FFFFFF` | `bg-white` | 상품 카드, 모달 팝업, 헤더/네비게이션 서피스 |

---

## 3. Typography Hierarchy (웹 타이포그래피 계층)

웹 환경에서는 시스템 폰트(Pretendard, Apple SD Gothic Neo, sans-serif)를 기준으로 가독성과 정보 밀도를 극대화합니다.

| 계층 | Tailwind 클래스 | 폰트 크기 / 행간 | 두께 | 적용 용도 |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `text-2xl lg:text-3xl font-extrabold tracking-tight` | 24px / 30px (웹 30px / 36px) | Bold / ExtraBold | 메인 페이지 타이틀, 라이브 방송 제목 |
| **Section Title** | `text-lg lg:text-xl font-bold tracking-tight text-slate-900` | 18px ~ 20px | Bold | 섹션 헤더, 서브탭 제목, 모달 타이틀 |
| **Card Title** | `text-sm lg:text-base font-semibold text-slate-900 line-clamp-2` | 14px ~ 16px | SemiBold | 상품명, 피드 게시글 제목 |
| **Price Bold** | `text-base lg:text-lg font-extrabold text-slate-900` | 16px ~ 18px | ExtraBold | 상품 가격 숫자, 결제 금액 |
| **Body Text** | `text-sm text-slate-600 leading-relaxed` | 14px | Regular / Medium | 상세 설명, 채팅 메시지 본문 |
| **Meta / Caption** | `text-xs text-slate-500` | 12px | Regular / Medium | 등록 시간, 지역 정보, 뱃지 라벨 |

---

## 4. Layout & Grid Standards (레이아웃 및 그리드 규격)

### 4.1 Global Shell & Containers
- **Max Content Width:** 데스크톱 기준 `max-w-7xl (1280px)` 또는 `max-w-6xl (1152px)` 중앙 정렬 (`mx-auto px-4 sm:px-6 lg:px-8`).
- **Header:** 상단 고정 헤더 (`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16`).
- **Main Nav Tabs:** 5대 메인 네비게이션 바 (`모꼬홈`, `모꼬마켓`, `모꼬LIVE`, `모꼬챗`, `마이모꼬`).

### 4.2 Product & Content Grid System
- **마켓 상품 그리드:**
  - 모바일(<640px): `grid-cols-2 gap-3`
  - 태블릿(640px~1024px): `grid-cols-3 gap-4`
  - 데스크톱(1024px+): `grid-cols-4 gap-6` (와이드 화면 `grid-cols-5`)
- **수다/피드 리스트:** `max-w-3xl mx-auto space-y-3`

---

## 5. Standard Component Styling (표준 컴포넌트 규격)

### 5.1 Card Components (상품 및 콘텐츠 카드)
- **카드 컨테이너:**
  ```html
  <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200">
  ```
- **썸네일 이미지:**
  - `aspect-square w-full object-cover`
  - 부드러운 호버 확대 (`group-hover:scale-105 transition-transform duration-300`)
  - 에스크로 안심 뱃지(`bg-slate-900/75 text-white text-[11px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm`)
  - 우측 상단 찜 하트 버튼
- **카드 정보 영역:**
  - 패딩: `p-3.5 sm:p-4`
  - 상품명: `text-sm sm:text-base font-semibold text-slate-900 line-clamp-2`
  - 지역 및 시간 메타: `text-xs text-slate-400 mt-1`
  - 가격: `text-base sm:text-lg font-extrabold text-slate-900 mt-1.5`

### 5.2 Sub-Tab Segment (중고거래 / 마켓상품 / 공동구매)
- **컨테이너:** `inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60`
- **비활성 탭:** `px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors`
- **활성 탭:** `px-4 py-2 text-sm font-bold text-[#FF3B6B] bg-white rounded-lg shadow-sm border border-slate-200/50`

### 5.3 Buttons & Interactive Controls
- **Primary CTA:**
  ```html
  <button className="h-11 px-6 rounded-xl bg-[#FF3B6B] hover:bg-[#E02956] text-white font-bold text-sm transition-colors shadow-sm active:scale-98">
  ```
- **Secondary / Outline:**
  ```html
  <button className="h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors">
  ```
- **아이콘 원칙:**
  - 텍스트 이모지(🥕, 🛒, 🔥, ✨ 등)는 Lucide React 벡터 아이콘(`ShoppingBag`, `Store`, `Flame`, `ShieldCheck` 등)으로 완전 대체.

### 5.4 Media Fallbacks (엑스박스 방지 안전 렌더링)
- 모든 이미지 태그(`<img />`)는 로딩 실패 시 빈 박스나 엑스박스가 노출되지 않도록 표준 Fallback 핸들러(`onError`) 또는 플레이스홀더를 기본 바인딩합니다.
- 상세 페이지 클릭 시 해당 상품 ID와 실제 데이터가 정상 매핑되도록 보장합니다.
