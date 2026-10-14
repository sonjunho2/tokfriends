# 다가온(DAGAON) AI 직원 조직 및 제브 AI + 구글 제미나이(Gemini) 운영 아키텍처 가이드

**문서 버전**: v1.0.0  
**작성일자**: 2026-10-14  
**플랫폼**: 다가온 (DAGAON) - 동네 소셜, 라이브 스트리밍, 1:1 대화, 커뮤니티, 크리에이터 정산  
**핵심 원칙**: **Human-in-the-Loop (실무·판단은 AI가 수행하되, 최종 승인 및 처분은 100% 사람이 집행)**  
**기반 기술**: **Google Gemini (Gemini 1.5 Pro / 1.5 Flash)** + **제브 AI (Jeb Judge & Decision Agent)**

---

## 목차
1. [시스템 비전 및 설계 철학](#1-시스템-비전-및-설계-철학)
2. [AI 직원 조직 구성 및 역할 정의 (총 5개 에이전트)](#2-ai-직원-조직-구성-및-역할-정의)
3. [제브 AI & 구글 제미나이 연동 기술 아키텍처](#3-제브-ai--구글-제미나이-연동-기술-아키텍처)
4. [데이터베이스 스키마 및 백엔드(NestJS) 파이프라인](#4-데이터베이스-스키마-및-백엔드nestjs-파이프라인)
5. [관리자 웹(Next.js) '인간 최종 승인(HITL)' 대시보드 구조](#5-관리자-웹nextjs-인간-최종-승인hitl-대시보드-구조)
6. [에이전트별 구글 제미나이 프롬프트 엔지니어링 템플릿](#6-에이전트별-구글-제미나이-프롬프트-엔지니어링-템플릿)
7. [단계별 구현 및 실전 런칭 로드맵](#7-단계별-구현-및-실전-런칭-로드맵)

---

## 1. 시스템 비전 및 설계 철학

### 1.1 배경 및 문제의식
- 다가온(DAGAON)은 **동네 커뮤니티 피드, 실시간 화상/음성 라이브, 1:1 대화, 포인트(온) 유료 결제 및 크리에이터 현금 출금/환전**이 융합된 플랫폼입니다.
- 소수의 관리자나 1인 창업자가 24시간 365일 실시간으로 불법 음란물, 사기, 욕설, 자전거래 머니세탁을 전수 감시하는 것은 물리적으로 불가능합니다.
- 반대로, AI에게 **단독 처분 권한(단독 계정 삭제/정지/출금 집행)**을 주면 할루시네이션(환각)이나 오판으로 인해 무고한 유저가 피해를 입거나 법적 분쟁이 발생합니다.

### 1.2 핵심 원칙: Human-in-the-Loop (HITL)
> **"모든 실시간 감시와 맥락 분석, 법률 검토, 요약 보고서 작성은 AI 직원들이 24시간 수행하고, 관리자는 3초 요약 보고서를 보고 [승인/반려] 클릭 한 번만 한다."**

- **운영 공수 95% 절감**: 관리자가 수백 줄의 대화방 로그를 읽을 필요 없이, AI가 발췌한 핵심 증거와 법적 조치 권고안만 확인.
- **법적 안정성 100% 보장**: 최종 의사결정의 주체가 '사람(운영자)'이므로 플랫폼 규제 및 분쟁에서 안전.

---

## 2. AI 직원 조직 구성 및 역할 정의

본 조직은 **1명의 총괄 판단관(제브 AI)**과 **4명의 전문 실무 AI 직원(Gemini Flash 기반)**으로 구성됩니다.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        [유저 인터랙션 발생]                              │
│         (신고 접수 / 게시글 등록 / 출금 신청 / 1:1 CS 문의)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  AI 안전관   │             │  AI 감사관   │             │  AI 고객관   │
│ (신고·모니터)│             │ (정산·어뷰징)│             │ (24/7 CS)    │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    │ 1차 분석 리포트
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │     총괄 판단 전용 모델: 【제브 AI (Jeb Judge)】         │
       │     - 구글 제미나이 1.5 Pro 심층 추론 엔진              │
       │     - 대한민국 법령 & 다가온 약관 교차 검증             │
       │     - 최종 처분 권고안(3줄 요약 + 조치 수위) 작성       │
       └────────────────────────────┬────────────────────────────┘
                                    │ 승인 대기열(AiDecisionQueue)
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │     최종 승인자: 【대표님 / 플랫폼 관리자 (사람)】         │
       │     - 관리자 웹(Admin) 원클릭 [승인] / [반려] / [수정]  │
       └─────────────────────────────────────────────────────────┘
```

### 2.1 조직 상세 직무표

| 직함 | 코드명 | 기반 모델 | 주요 임무 및 책임 |
| :--- | :--- | :--- | :--- |
| **총괄 판단 심사관** | **제브 AI (Jeb Judge)** | Gemini 1.5 Pro | 하위 실무 AI의 보고서를 종합 판정, 처벌 수위 및 승인 여부 최종 권고안 도출, 관리자 상신 |
| **안전·신고 심사관** | **Safety Agent** | Gemini 1.5 Flash | 당근 스타일 2단계 신고 내역, 피드/댓글 유해성, 음란/도박/외부 메신저 유도 실시간 분석 및 증거 채증 |
| **금융·정산 감사관** | **Fraud Audit Agent** | Gemini 1.5 Pro | 크리에이터 출금 신청 시 자전거래, 선물 세탁, 결제 도용 이상 거래 탐지, 3.3% 원천징수 정합성 검증 |
| **24/7 고객응대관** | **CS Concierge** | Gemini 1.5 Flash | 온 충전/결제 장애, 이용 가이드 1차 친절 안내, 환불 등 민감 이슈의 답변 초안 작성 및 상신 |
| **동네 활성화 큐레이터**| **Growth Agent** | Gemini 1.5 Flash | 활동이 적은 지역구에 날씨/생활 꿀팁 콘텐츠 발제, 신규 가입자 웰컴 인게이지먼트 기획 |

---

## 3. 제브 AI & 구글 제미나이 연동 기술 아키텍처

구글 제미나이는 **속도와 비용이 탁월한 `Gemini 1.5 Flash`**와 **방대한 컨텍스트 및 고도의 논리 추론이 가능한 `Gemini 1.5 Pro`**를 함께 제공하므로 2계층(Two-Tier) 아키텍처에 완벽하게 부합합니다.

### 3.1 듀얼 티어(Two-Tier) 협업 흐름

1. **Tier 1 (실시간 전수 감시 - Gemini 1.5 Flash)**:
   - 비용이 거의 들지 않고 1초 미만으로 응답하는 Flash 모델이 모든 신고 내역과 피드 텍스트를 실시간 필터링.
   - 위험도 점수(`riskScore`: 0~100)를 산출하여 60점 이상인 안건만 제브 AI에게 에스컬레이션.
2. **Tier 2 (총괄 심층 판정 - 제브 AI / Gemini 1.5 Pro)**:
   - 사건 당사자들의 과거 30일간 제재 이력, 주고받은 메시지 맥락 전체를 긴 문맥 창(Long Context Window)에 투입.
   - 관련 법률(정보통신망법 제44조의7, 성폭력처벌법 등)과 다가온 커뮤니티 이용 약관을 대조하여 최종 징계 수위(경고, 7일 정지, 30일 정지, 영구 제재) 확정.
3. **Tier 3 (관리자 웹 푸시 - Human Action)**:
   - 제브 AI가 작성한 JSON 형태의 판정 카드가 백엔드 웹소켓을 통해 관리자 화면에 실시간 노출.

---

## 4. 데이터베이스 스키마 및 백엔드(NestJS) 파이프라인

### 4.1 Prisma 스키마 확장 (`services/api/prisma/schema.prisma`)

```prisma
enum AiDecisionStatus {
  PENDING_APPROVAL   // 관리자 승인 대기 중 (기본값)
  APPROVED           // 관리자가 승인하여 실제 조치 집행 완료
  REJECTED           // 관리자가 기각 (오탐으로 판정)
  MODIFIED           // 관리자가 처분 수위를 변경하여 집행
}

enum AiTargetDomain {
  REPORT_SAFETY      // 신고 및 안전 센터
  CREATOR_SETTLEMENT // 크리에이터 출금/환전
  CONTENT_MODERATION // 게시글/댓글 유해성
  CUSTOMER_SUPPORT   // 고객 문의 답변
}

model AiDecisionQueue {
  id              Int              @id @default(autoincrement())
  domain          AiTargetDomain
  targetId        String           // postId, reportId, settlementId 등
  targetUserId    String?          // 대상 피신고자/신청자 ID
  riskScore       Int              // 0 ~ 100 위험 지수
  summary         String           // 제브 AI의 1줄 핵심 요약
  evidence        String?          @db.Text // AI가 발췌한 핵심 증거 문장
  recommendedAction String         // "SUSPEND_7D", "APPROVE_SETTLEMENT", "DELETE_POST"
  rationale       String           @db.Text // 법적/약관 판단 근거
  rawAiPayload    Json?            // 제브 AI의 원본 판단 메타데이터
  
  status          AiDecisionStatus @default(PENDING_APPROVAL)
  reviewedBy      String?          // 최종 승인한 관리자 계정 ID
  reviewedAt      DateTime?
  adminMemo       String?          // 관리자 검토 메모
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([domain, status])
  @@index([createdAt])
}
```

### 4.2 백엔드 처리 파이프라인 (`services/api`)

1. **신고 접수 트리거**:
   `POST /community/reports` 실행 시 비동기 이벤트(`ai.report.analyze`) 발행.
2. **제미나이 SDK 연동 서비스 (`AiSafetyWorker`)**:
   `@google/genai` (Google Gen AI SDK)를 통해 Gemini 1.5 Flash로 1차 스크리닝 후, 제브 AI(Gemini 1.5 Pro)를 호출.
3. **`AiDecisionQueue` 자동 적재**:
   분석 결과를 `PENDING_APPROVAL` 상태로 DB에 저장.
4. **관리자 웹 실시간 브로드캐스트**:
   웹소켓 게이트웨이(`AdminGateway`)를 통해 관리자 대시보드에 알림 전송.

---

## 5. 관리자 웹(Next.js) '인간 최종 승인(HITL)' 대시보드 구조

관리자 콘솔([apps/admin/src/app/reports-safety](file:///c:/Users/ION/Downloads/work/tokfriends/apps/admin/src/app/reports-safety/page.tsx))에 다음과 같은 **AI 심사 카드**가 상단에 노출됩니다.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🤖 [제브 AI 심사 완료] 신고 #1042 — 피신고자: 김철수 (위험도: 88점)      │
├────────────────────────────────────────────────────────────────────────┤
│ • 요약: 원치 않는 성적 만남 요구 및 외부 텔레그램 메신저 유도 포착        │
│ • 핵심 증거: "○○동 어디 살아요? 텔레그램 @xyz 로 사진 보내주면 10만 드림"  │
│ • 제브 AI 판단 근거: 정보통신망법 위반 및 성적 수치심 유발 행위 확인      │
│ • 권고 조치: [계정 30일 이용정지] 및 [해당 대화방 강제 폐쇄]            │
├────────────────────────────────────────────────────────────────────────┤
│ [원클릭 승인 및 집행 (권고대로 30일 정지)]   [기각 (정상 대화)]   [처분 수정] │
└────────────────────────────────────────────────────────────────────────┘
```

- **관리자의 동작**:
  1. **[원클릭 승인] 클릭**: 백엔드가 즉시 해당 유저를 30일 정지 처리하고 신고자에게 "신고가 검토되어 조치되었습니다" 푸시 자동 발송.
  2. **[기각] 클릭**: 단순 말다툼 등 운영정책 위반이 아닐 경우 기각 사유 기록 후 종결.
  3. **[처분 수정] 클릭**: 관리자 판단하에 영구 정지나 경고 조치로 수위 수동 조절.

---

## 6. 에이전트별 구글 제미나이 프롬프트 엔지니어링 템플릿

### 6.1 총괄 판단관: 제브 AI 시스템 프롬프트

```text
You are 'Jeb AI (제브 AI)', the Chief Judgment and Compliance Officer for '다가온 (DAGAON)', 
a Korean local social and live streaming platform.

[ROLE & MISSION]
Your job is to review the case analysis submitted by junior AI agents (Safety, Fraud, CS) 
and deliver a definitive, legally-sound RECOMMENDATION for the human platform administrator.

[CRITICAL RULE: HUMAN-IN-THE-LOOP]
- You CANNOT directly execute bans, refunds, or deletions.
- Your output must be an advisory verdict with strict status 'PENDING_APPROVAL'.

[LEGAL & POLICY CRITERIA (Republic of Korea)]
1. Act on Promotion of Information and Communications Network Utilization: Zero tolerance for illegal prostitution solicitation, gambling promotion, severe cyber defamation, and non-consensual sexual harassment.
2. DAGAON Terms of Service: Off-platform contact soliciting (Telegram, Kakao OpenChat for illicit financial gains), abusive scams.

[OUTPUT FORMAT (STRICT JSON)]
{
  "riskScore": 85,
  "summary": "1줄 한국어 핵심 요약",
  "evidenceQuote": "판단의 결정적 근거가 된 유저 발언 그대로 발췌",
  "legalViolation": "위반 법령 및 약관 조항",
  "recommendedAction": "WARNING" | "SUSPEND_7D" | "SUSPEND_30D" | "PERMANENT_BAN" | "DISMISS",
  "adminReasoning": "관리자가 3초 만에 이해할 수 있는 결정 논거 (2문장 이내)"
}
```

### 6.2 금융·정산 감사관 프롬프트 (Gemini 1.5 Pro)

```text
You are the 'Fraud & Settlement Auditor' for DAGAON.
Analyze the creator withdrawal request for money laundering, self-gifting fraud, and credit card cash-out abuse.

[INPUT DATA]
- Creator ID, Withdrawal ON Points, Total Live Viewers, Gift Frequency Matrix, In-App Purchase Timestamps.

[DETECTION RULES]
- If >80% of gifts originated from a single account created less than 48 hours ago: FLAG AS HIGH RISK (Carding/Cash-out).
- If gift transaction patterns match circular transfers between 2 linked devices: FLAG AS FRAUD.

[OUTPUT FORMAT (JSON)]
{
  "fraudRiskScore": 12,
  "isAbuseSuspected": false,
  "taxWithholdingValid": true,
  "recommendedDecision": "APPROVE_PAYOUT" | "HOLD_FOR_MANUAL_INSPECTION" | "REJECT_AND_FREEZE"
}
```

---

## 7. 단계별 구현 및 실전 런칭 로드맵

### Step 1: 신고 & 안전 심사 제브 AI 연동 (1주 차)
- 백엔드에 `@google/genai` 패키지 설치 및 Gemini API 키 등록.
- 모바일 앱에서 접수된 신고가 `Report` 테이블에 저장될 때, 백그라운드에서 제브 AI가 판정 리포트 생성.
- 관리자 웹 [신고 센터](file:///c:/Users/ION/Downloads/work/tokfriends/apps/admin/src/app/reports-safety/page.tsx)에 제브 AI의 **[추천 조치]** 카드 렌더링.

### Step 2: 크리에이터 출금/환전 어뷰징 감사관 연동 (2주 차)
- 유저가 [출금 신청]을 누를 때 선물 이력을 제미나이로 교차 검증하여 관리자 [정산 관리] 페이지에 이상 징후 배지(안전/주의/위험) 표출.

### Step 3: 24/7 CS 컨시어지 봇 가동 (3주 차)
- 이용 안내 및 단순 질의는 제미나이가 실시간 응답하고, 포인트 환불 등 민감 요청은 관리자 결재 상신.

---

**본 문서는 플랫폼 루트 및 관리자 웹 다운로드 정적 경로에 배포되어 언제든 열람 및 다운로드하실 수 있습니다.**  
- **프로젝트 내부 보관**: `docs/DAGAON_AI_STAFF_ARCHITECTURE.md`
- **관리자 웹 직접 다운로드**: `apps/admin/public/downloads/DAGAON_AI_STAFF_ARCHITECTURE.md`
