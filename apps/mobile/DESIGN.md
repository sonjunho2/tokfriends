# MOCCO Mobile Design System Specification (DESIGN.md)

**Project:** MOCCO Mobile (모꼬 모바일 앱)  
**Target Environment:** React Native (Expo SDK 52, Android & iOS)  
**Status:** Canonical Design System Specification (기준 명세서)  
**Single Source of Code Tokens:** `apps/mobile/src/theme/tokens.ts`

---

## 1. Visual Theme & Atmosphere (시각적 정체성 및 분위기)

### 1.1 Aesthetic Philosophy (디자인 철학)
MOCCO(모꼬) 모바일 앱은 **"이웃 간의 실시간 소통(동네 친구·1줄 수다)과 생생한 라이브 커머스(안전 에스크로 마켓·실시간 공구)"**가 결합된 차세대 소셜 커머스 플랫폼입니다.
- **Vibrant & Friendly (생동감과 친근함):** 네온 코랄 핑크와 바이올렛 퍼플 그라디언트를 키 컬러로 활용하여, 단순한 거래 게시판을 넘어 실시간 라이브 스트리밍과 따뜻한 동네 소통의 에너지를 직관적으로 전달합니다.
- **Trust & Commercial Crispness (금융 에스크로의 신뢰도와 정갈함):** Slate 딥 다크 그레이 타이포그래피, 100% 에스크로 안전결제 뱃지, 군더더기 없는 화이트 서피스와 정교한 헤어라인 보더(`0.5px ~ 1px`)를 통해 금융/결제 레벨의 시각적 안정감을 보장합니다.
- **Tactile Ergonomics (손끝에 감기는 모바일 조작성):** 44pt 이상의 터치 타깃, 모바일 하단 제스처 중심의 플로팅 액션 버튼(FAB), 바텀시트 중심의 모달 인터랙션을 기본 원칙으로 합니다.

### 1.2 Layout Density & Spacing Rhythm (밀도 및 리듬)
- **Screen Margins:** 기본 화면 좌우 여백은 `16px` (컴팩트 카드 그리드는 `12px`).
- **Section Gap:** 주요 컴포넌트 섹션 간 간격은 `24px ~ 32px`로 명확한 시각적 구분을 제공합니다.
- **Surface Elevation:** 메인 배경은 소프트 오프화이트(`Slate-50 #F8FAFC`), 카드는 순백색(`Pure White #FFFFFF`)으로 깊이감을 계층화합니다.

---

## 2. Color Palette & Roles (색상 체계 및 기능적 역할)

모든 색상은 `tokens.colors`를 단일 진실 공급원(SSOT)으로 사용하며, 인라인 하드코딩 색상은 금지합니다.

### 2.1 Brand Accents (브랜드 핵심 색상)
| 색상 명칭 | Hex 코드 | 기능 및 적용 대상 |
| :--- | :--- | :--- |
| **Neon Coral Pink** (Primary) | `#FF3B6B` | 핵심 CTA 버튼, 활성 탭 인디케이터, 라이브 온에어 뱃지, 관심 하트 |
| **Deep Coral Hover** | `#E02956` | Primary 버튼 터치 시 프레스 피드백 상태 |
| **Soft Pink Tint** | `#FFEBF0` | Primary 서브 뱃지 배경, 틴트 버튼, 입력창 포커스 하이라이트 |
| **Vibrant Purple** (Secondary) | `#8B5CF6` | 라이브 커머스 핀, VIP 스트리머 뱃지, 실시간 BEST 랭킹 마크 |
| **Soft Purple Tint** | `#F3E8FF` | 공구 달성률 배경, 프리미엄 상품 카테고리 태그 |

### 2.2 Neutral Scales (무채색 스케일)
| 색상 명칭 | Hex 코드 | 기능 및 적용 대상 |
| :--- | :--- | :--- |
| **Deep Slate** (Text Primary) | `#0F172A` | 헤드라인, 상품명, 가격 숫자, 핵심 텍스트 |
| **Muted Slate** (Text Secondary) | `#475569` | 서브 텍스트, 상품 설명 요약, 날짜 및 위치 정보 |
| **Light Slate** (Text Tertiary / Muted) | `#94A3B8` | 플레이스홀더, 비활성 탭 아이콘, 보조 캡션 |
| **Canvas Background** | `#F8FAFC` | 앱 전체 스크린 기본 배경색 |
| **Card Surface** | `#FFFFFF` | 리스트 카드, 바텀시트, 모달 다이얼로그 배경 |
| **Layer Surface** | `#F1F5F9` | 검색창 인풋 배경, 서브 세그먼트 배경, 비활성 태그 |
| **Hairline Border** | `#E2E8F0` | 카드 외곽선, 리스트 구분선, 탭바 상단 헤어라인 |

### 2.3 Semantic & Status (상태 및 의미론적 색상)
| 상태 명칭 | Hex 코드 | 기능 및 적용 대상 |
| :--- | :--- | :--- |
| **Live Streaming** | `#FF3B6B` | 실시간 방송 중 펄스 인디케이터, 온에어 뱃지 |
| **User Online** | `#10B981` | 친구 및 판매자 실시간 접속 상태 점 (그린 도트) |
| **Busy / Away** | `#F59E0B` | 통화 중, 부재중 상태 |
| **Escrow Trust / Safe** | `#3B82F6` | 토스페이먼츠 PG 및 모꼬 안심 에스크로 보증 뱃지 |
| **Error / Destructive** | `#EF4444` | 유효성 오류, 게시글 삭제, 신고 및 경고 알림 |

### 2.4 Gradients (그라디언트)
- **Primary Pink Gradient:** `['#FF3B6B', '#FF758C']` (주요 구매 버튼, 출석체크, 프로필 하이라이트)
- **Live Center FAB Gradient:** `['#FF3B6B', '#8B5CF6']` (하단 탭바 중앙 '모꼬 LIVE' 플로팅 서클)
- **Card Media Scrim:** `['transparent', 'rgba(15, 23, 42, 0.85)']` (라이브 방송 썸네일 및 상품 이미지 오버레이)

---

## 3. Typography Rules (타이포그래피 규칙)

React Native 환경에서 시스템 폰트(iOS: Apple SD Gothic Neo, Android: Pretendard/Roboto)를 기반으로 작동하며, 음수 자간(`letterSpacing`)을 적용하여 한국어 타이포그래피의 가독성을 극대화합니다.

| 계층 (Token) | 크기 (Size) | 굵기 (Weight) | 행간 (Line Height) | 자간 (Letter Spacing) | 적용 용도 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **h1** | `24px` | `700` (Bold) | `32px` | `-0.5px` | 메인 화면 대형 헤드라인, 상세 화면 상품명 |
| **h2** | `20px` | `700` (Bold) | `28px` | `-0.4px` | 섹션 타이틀, 상품 가격 강조, 모달 타이틀 |
| **h3** | `17px` | `600` (SemiBold) | `24px` | `-0.3px` | 리스트 아이템 제목, 네비게이션 헤더 중앙 타이틀 |
| **body1** | `15px` | `400` / `500` | `22px` | `-0.2px` | 피드 본문 내용, 채팅 메시지 본문, 폼 라벨 |
| **body2** | `13px` | `400` (Regular) | `18px` | `-0.1px` | 판매자 닉네임, 등록 시간, 위치 정보, 부가 설명 |
| **caption** | `11px` | `500` (Medium) | `15px` | `0px` | 뱃지 라벨, 태그, 타임스탬프, 부가 메타데이터 |
| **tabLabel** | `10px` | `600` (SemiBold) | `14px` | `-0.1px` | 하단 탭바 메뉴 명칭 |

---

## 4. Geometry & Elevation (형태, 라운딩 및 그림자)

### 4.1 Corner Radii (곡률 토큰)
- **Pill / Circular (`9999px`):** 카테고리 필터 칩, 원형 아바타, 하단 중앙 라이브 FAB 버튼, 온·오프라인 상태 점.
- **Sheet Top Corner (`24px`):** 바텀시트 상단 좌우 모서리, 대형 팝업 다이얼로그.
- **Card Surface (`16px ~ 20px`):** 상품 피드 카드, 라이브 스트리밍 프리뷰 박스, 채팅방 카드.
- **Form Control (`12px ~ 14px`):** 검색 입력창, 텍스트 필드, 리스트 내부 액션 버튼.
- **Micro Badge (`4px ~ 8px`):** 상태 뱃지, 할인율 태그, 카테고리 라벨.

### 4.2 Depth & Shadows (그림자 및 입체감)
- **Soft Layer (`shadowOpacity: 0.05`, `shadowRadius: 12`, `elevation: 2`):** 리스트 내부 일반 카드. 배경과 경계선을 분리하되 눈에 띄지 않는 은은한 확산광.
- **Floating Element (`shadowOpacity: 0.22`, `shadowColor: '#FF3B6B'`, `elevation: 6`):** 등록 플로팅 액션 버튼(FAB), 결제 유도 스티키 바. 브랜드 컬러 빛 번짐 효과.
- **Bottom Sheet (`shadowOpacity: 0.12`, `shadowRadius: 20`, `elevation: 16`):** 화면 하단에서 슬라이드 업되는 프로필 시트 및 결제 시트.

---

## 5. Standard Component Specifications (표준 컴포넌트 규격)

### 5.1 App Navigation & Headers (상단 네비게이션)
- **Main App Header:**
  - 높이: `52px` (상단 노치 Safe Area 제외).
  - 좌측: MOCCO 로고 텍스트 및 지역 선택 드롭다운 칩.
  - 우측: 검색(`search-outline`), 알림(`notifications-outline`) 아이콘 버튼 (터치 영역 `40x40px`).
  - 하단 경계: `1px` 헤어라인 디바이더 (`#F1F5F9`).
- **Segment Tab Bar (3단 세그먼트 컨트롤):**
  - 배경: `Slate-100 (#F1F5F9)`, 라운딩 `16px`, 패딩 `4px`.
  - 활성 탭: 배경 `White (#FFFFFF)`, 라운딩 `12px`, 텍스트 `Primary (#FF3B6B)` 또는 `Dark (#0F172A)`, 소프트 섀도우.
  - 전환 애니메이션: 탭 변경 시 탭 간 부드러운 스위칭 보장.

### 5.2 Bottom Navigation Bar (하단 5대 탭바)
- **구조:** 4개 일반 탭 + 1개 중앙 플로팅 탭.
  - `모꼬홈` (Home)
  - `모꼬마켓` (Market: 중고거래 / 마켓상품 / 공동구매)
  - `모꼬 LIVE` (Live: 중앙 원형 그라디언트 돌출 FAB)
  - `모꼬챗` (Chat: 친구들 / 전체수다 / 대화함)
  - `마이모꼬` (MyPage: 지갑 및 내 정보)
- **치수:** 기본 높이 `62px` + 기기별 Safe Area 하단 패딩 (`Math.max(insets.bottom, 14)`).
- **중앙 FAB:** 지름 `56px`, 탭바 상단으로 `16px` 돌출, 그라디언트 채색, 백색 라벨.

### 5.3 Feed & Grid Cards (카드 규격)
- **2열 마켓 상품 카드 (`MarketProductCard`):**
  - 이미지 종횡비: `1:1` 정사각, 라운딩 `12px`.
  - 우측 상단 뱃지: 에스크로 안심결제 라벨 및 하트 찜 토글 버튼.
  - 타이틀: 최대 2줄 제한 (`line-clamp-2`), `14px`, Slate-800.
  - 가격: `16px` Bold, 원화 천 단위 콤마 표기 (`10,000원`), 할인율 있을 시 네온 핑크 퍼센트 병기.
- **1줄 수다 카드 (`SudaCard`):**
  - 좌측: 둥근 유저 아바타 (`36px`) + 실시간 온라인 상태 도트.
  - 우측: 닉네임, 동네 명칭, 등록 시간, 수다 본문, '대화하기' 무료/꿀떡 뱃지 버튼.

### 5.4 Floating Action Button (`ScrollExpandableFAB`)
- **인터랙션:** 스크롤 시 축소(`Circular 52px`), 스크롤 정지/상단 도달 시 확장(`Pill 52px 높이 + 텍스트 노출`).
- **위치:** 하단 탭바 기준 상단 `16px`, 우측 `16px` 고정.
- **스타일:** Primary Pink 단색 또는 그라디언트, 그림자 `elevation: 6`.

### 5.5 Global Bottom Sheet (`UserProfileBottomSheet` / `PgPaymentBottomSheet`)
- **디자인:** 상단 드래그 핸들 바 (`36x4px`, `#CBD5E1`), 모서리 반경 `24px`.
- **배경 딤(Scrim):** `rgba(15, 23, 42, 0.5)` 반투명 블러.
- **제스처:** 아래로 스와이프하여 닫기, 백드롭 터치 시 닫기 기본 지원.

---

## 6. Interaction & Micro-UX Principles (터치 인터랙션 원칙)

1. **Touch Feedback (터치 피드백):** 모든 클릭 가능한 요소(`TouchableOpacity`, `Pressable`)는 `activeOpacity: 0.85` 또는 프레스 스케일 축소 효과를 적용하여 사용자 조작 피드백을 제공합니다.
2. **Safe Area Compliance (안전 영역 준수):** 노치(상단) 및 홈 인디케이터(하단)와의 겹침을 방지하기 위해 반드시 `useSafeAreaInsets()`를 적용합니다.
3. **Skeleton & Empty State (로딩 및 빈 화면):**
   - 네트워크 로딩 시 레이아웃 형태를 유지하는 스켈레톤 UI를 제공합니다.
   - 빈 목록일 경우 `EmptyStateView`를 렌더링하고, 친근한 이모지/일러스트와 함께 바로 행동할 수 있는 CTA 버튼을 배치합니다.
4. **Resilient Media Rendering (안전한 미디어 렌더링):** 
   - 이미지 로딩 실패 시 카테고리별 Fallback Unsplash URL을 바인딩하여 엑스박스나 흰 공백 노출을 방지합니다.

---
*본 명세서는 Stitch 스킬 및 향후 모든 모바일 신규 스크린/컴포넌트 개발 시 통일된 디자인 기준(SSOT)으로 작동합니다.*
