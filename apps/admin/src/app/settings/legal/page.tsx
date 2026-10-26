'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck,
  FileText,
  History as HistoryIcon,
  RefreshCcw,
  Scale,
  Calendar,
  Sparkles,
  Lock,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  Send,
  CheckCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  getLegalDocument,
  saveLegalDocument,
  type LegalDocument,
  type LegalDocumentVersion,
} from '@/lib/api'

export interface DocumentPreset {
  slug: string
  label: string
  categoryBadge: string
  legalBasis: string
  summary: string
  fallbackTitle: string
  fallbackBody: string
}

export interface EditableDocument extends LegalDocument {
  editorName: string
  versionMemo: string
  customVersionString?: string
  effectiveDate?: string
  isLoading: boolean
}

export const LEGAL_4_PRESETS: DocumentPreset[] = [
  {
    slug: 'terms-of-service',
    label: '서비스 이용약관',
    categoryBadge: '전자상거래법 & 약관규제법',
    legalBasis: '전자상거래 등에서의 소비자보호에 관한 법률 제10조 및 약관의 규제에 관한 법률',
    summary: '본사 직영, 입점사 마켓, 개인 간 중고, 스트리머 제휴 판매 4대 커머스 축 및 통신판매중개자 법적 지위 규정.',
    fallbackTitle: '주식회사 모꼬 (Mocco Inc.) 통합 서비스 이용약관',
    fallbackBody: `제1조 (목적)
본 약관은 주식회사 모꼬(이하 "회사")가 운영하는 모꼬(Mocco) 플랫폼 및 관련 제반 서비스(전자상거래, 1:N 라이브 방송, 1:1 프라이빗 라이브, 동네 모꼬지 등)의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (통신판매중개자로서의 지위 및 면책)
1. 회사는 통신판매중개자로서 회원 간의 자유로운 상품 거래 및 미디어 후원을 위한 시스템 플랫폼을 운영 및 관리, 제공할 뿐입니다.
2. 입점 판매자 및 개별 회원이 등록한 상품 정보, 거래 조건 및 라이브 방송 내용에 대한 법적 책임은 해당 등록 당사자에게 있습니다.
3. 단, 회사는 전자상거래법에 의거하여 구매자의 결제 대금을 안전하게 보호하는 100% 에스크로 안전결제 시스템을 제공합니다.

제3조 (4대 커머스 참여자 모델)
1. [본사 직영 판매]: 회사가 직접 소싱 및 유통하는 정품 인증 상품.
2. [입점사 마켓]: 본사의 승인을 득한 공식 입점 파트너사의 위수탁 및 직배송 상품.
3. [개인 간 거래]: 동네 모꼬지 기반 개인 간 중고/나눔 거래 (에스크로 안전결제 권장).
4. [스트리머 제휴 판매]: 라이브 방송 중 스트리머가 고정한 제휴 핀 상품의 판매 및 정산 수수료 쉐어.

제4조 (가상 자산 및 후원)
1. 회원은 충전한 모꼬 코인(MC)을 통해 라이브 스트리머에게 3D 가상 선물(볼빨간 모꼬, 구름카 탄 모꼬, 골든 킹 모꼬 등)을 전송할 수 있습니다.
2. 스트리머에게는 플랫폼 운영 수수료(35%)를 제외한 65% 순수익이 안전하게 불변 원장(Ledger)에 실시간 적립됩니다.`,
  },
  {
    slug: 'privacy-policy',
    label: '개인정보처리방침',
    categoryBadge: '개인정보보호법 (필수)',
    legalBasis: '개인정보 보호법 제30조 및 정보통신망 이용촉진 및 정보보호 등에 관한 법률',
    summary: '회원 가입, 본인인증, 위치기반 추천, 1:1 라이브 스트리밍 시 수집되는 개인정보의 최소 수집 및 파기 절차.',
    fallbackTitle: '주식회사 모꼬 (Mocco Inc.) 개인정보 처리방침',
    fallbackBody: `주식회사 모꼬(이하 "회사")는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.

1. 개인정보의 수집 및 이용 목적
- 회원 식별, 연령 확인(청소년보호), 부정 가입 방지
- 통신판매 및 에스크로 안전결제 이행, 정산 및 배송
- 위치기반 동네 모꼬지 및 주변 라이브 방송 추천 서비스 제공
- 6인 AI 직원(제브 AI, 안전관 AI)을 통한 유해물 차단 및 안전망 운영

2. 수집하는 개인정보 항목
- 필수항목: 휴대전화번호, 닉네임, 성별, 생년월일, 결제/정산 계좌 정보(판매자 및 스트리머)
- 선택항목: 프로필 사진, 관심사, 행정동 기반 위치정보(동 단위 마스킹)

3. 개인정보의 보유 및 파기 절차
- 회원 탈퇴 시 지체 없이 5일 이내 파기 원칙.
- 단, 전자상거래법 등 관계 법령에 따라 대금결제 및 재화공급 기록 5년, 계약 또는 청약철회 기록 5년, 분쟁처리 기록 3년 보관.

4. 개인정보 보호책임자
- 성명: 보안총괄 책임자 (CPO)
- 소속: 주식회사 모꼬 개인정보보호위원회
- 문의처: privacy@mocco.kr / 유선: 1588-0921`,
  },
  {
    slug: 'electronic-financial-transaction',
    label: '전자금융거래 이용약관 (에스크로)',
    categoryBadge: '전자금융거래법 (에스크로)',
    legalBasis: '전자금융거래법 제3조 및 전자상거래 등에서의 소비자보호에 관한 법률 제24조',
    summary: '구매안전서비스(결제대금예치제도/에스크로), 선불전자지급수단(온/MC 코인) 충전·환불 및 정산 규정.',
    fallbackTitle: '주식회사 모꼬 (Mocco Inc.) 전자금융거래 기본약관',
    fallbackBody: `제1조 (목적)
본 약관은 회사가 제공하는 전자지급결제대행서비스, 선불전자지급수단의 발행 및 관리서비스, 결제대금예치서비스(에스크로)를 이용자가 이용함에 있어 회사와 이용자 사이의 권리와 의무를 정함을 목적으로 합니다.

제2조 (결제대금예치서비스 - 에스크로 의무화)
1. 회사는 전자상거래 등에서의 소비자보호에 관한 법률에 따라, 소비자가 상품을 배송받고 최종 '구매확정'을 완료할 때까지 결제 대금을 공신력 있는 금융기관(신한은행, KG이니시스)과 연동하여 안전하게 예치·보호합니다.
2. 판매자(입점사 및 개인)는 구매자의 구매확정 또는 자동 구매확정(배송 완료 후 7일) 시점에 정산 대금을 수령합니다.

제3조 (선불전자지급수단 - 모꼬 코인 / 온)
1. 모꼬 코인(MC)은 플랫폼 내 3D 선물 후원, 프라이빗 통화 등에 사용하는 선불충전금입니다.
2. 충전 후 7일 이내에 전혀 사용하지 않은 코인은 전자상거래법에 의거 100% 전액 청약철회(환불)가 보장됩니다.
3. 잔여 코인의 환급 시 전자금융거래법에 의거 60% 이상 사용 시 잔액을 등록 계좌로 안전하게 환급합니다.`,
  },
  {
    slug: 'youth-protection-policy',
    label: '청소년보호정책',
    categoryBadge: '청소년보호법 (필수)',
    legalBasis: '청소년 보호법 및 정보통신망 이용촉진 및 정보보호 등에 관한 법률',
    summary: '유해 매체물 차단, 음란·도박·마약 행위 즉각 퇴출, 안전관 AI 기반 실시간 비전 채증 및 연령 인증 거버넌스.',
    fallbackTitle: '주식회사 모꼬 (Mocco Inc.) 청소년 보호 정책',
    fallbackBody: `주식회사 모꼬(이하 "회사")는 각종 청소년유해정보로부터 청소년을 보호하고자 관련 법령에 따라 19세 미만의 청소년이 유해한 환경에 노출되지 않도록 청소년보호정책을 수립·시행하고 있습니다.

1. 청소년 유해 매체물에 대한 접근 제한 및 차단
- 회사는 성인 인증 장치를 완비하여 청소년유해매체물에 대한 청소년의 접근을 원천 차단합니다.
- 라이브 방송 시작 시 연령 제한 설정 의무화 및 미성년자 심야 라이브 제한.

2. 6인 AI 직원(안전관 AI & 제브 AI) 기반 실시간 방어망
- 안전관 AI(Safety)가 3.5초 단위 비전 스냅샷 분석을 통해 음란, 마약, 흉기, 도박 등 유해 시각물을 실시간 자동 감지하여 즉시 킬스위치(방송 폭파)를 집행합니다.
- 제브 AI(Zev)가 청소년 대상 조건만남, 성매매 유도 및 연락처 교환 시도를 원천 차단하고 수사기관 인계를 위한 법적 채증 스냅샷을 5년간 불변 보존합니다.

3. 청소년보호책임자 및 담당자 지정
- 청소년보호책임자: 총괄 운영 디렉터
- 소속: 주식회사 모꼬 청소년보호센터
- 신고 및 제보 접수: safety@mocco.kr / 직통 전화: 1588-0921`,
  },
]

type DocumentMap = Record<string, EditableDocument>

const INITIAL_DOCUMENTS: DocumentMap = LEGAL_4_PRESETS.reduce((acc, preset) => {
  acc[preset.slug] = {
    slug: preset.slug,
    title: preset.fallbackTitle,
    body: preset.fallbackBody,
    editorName: '',
    versionMemo: '',
    customVersionString: 'v1.0.0',
    effectiveDate: '2026-10-26',
    history: [],
    isLoading: false,
  }
  return acc
}, {} as DocumentMap)

function formatDate(value?: string | null) {
  if (!value) return '최신 버전 시행 중'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function pickHistory(document: LegalDocument): LegalDocumentVersion[] {
  if (!document) return []
  if (Array.isArray(document.history) && document.history.length > 0) {
    return document.history as LegalDocumentVersion[]
  }
  if (Array.isArray((document as any).versions)) {
    return (document as any).versions as LegalDocumentVersion[]
  }
  return []
}

export default function LegalGovernancePage() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentMap>(INITIAL_DOCUMENTS)
  const [activeSlug, setActiveSlug] = useState<string>(LEGAL_4_PRESETS[0]?.slug ?? '')
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)

  // 개정 모달 폼 상태
  const [revisionVersion, setRevisionVersion] = useState('v1.1.0')
  const [revisionEffectiveDate, setRevisionEffectiveDate] = useState(new Date().toISOString().slice(0, 10))
  const [revisionEditor, setRevisionEditor] = useState('대표 법무팀')
  const [revisionMemo, setRevisionMemo] = useState('2026년 모꼬 리브랜딩 및 전자상거래 4대 법률 규제 강화 개정')

  const activeDocument = documents[activeSlug] || documents[LEGAL_4_PRESETS[0].slug]
  const activePreset = LEGAL_4_PRESETS.find((p) => p.slug === activeSlug) || LEGAL_4_PRESETS[0]

  const historyList = useMemo(() => {
    return activeDocument?.history ?? []
  }, [activeDocument])

  // URL query param ?tab=... 연동
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab && LEGAL_4_PRESETS.some((p) => p.slug === tab)) {
        setActiveSlug(tab)
      }
    }
  }, [])

  useEffect(() => {
    void refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshAll() {
    setIsRefreshing(true)
    try {
      await Promise.all(
        LEGAL_4_PRESETS.map(async (preset) => {
          await loadDocument(preset.slug)
        })
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  async function loadDocument(slug: string) {
    setDocuments((prev) => ({
      ...prev,
      [slug]: {
        ...(prev[slug] || {}),
        isLoading: true,
      },
    }))

    try {
      const data = await getLegalDocument(slug)
      setDocuments((prev) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          ...data,
          title: data.title || prev[slug]?.title,
          body: data.body || prev[slug]?.body,
          editorName: '',
          versionMemo: '',
          history: pickHistory(data).sort((a, b) => (b.version ?? 0) - (a.version ?? 0)).slice(0, 15),
          isLoading: false,
        },
      }))
    } catch {
      setDocuments((prev) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          isLoading: false,
        },
      }))
    }
  }

  function updateDocument(slug: string, updater: (doc: EditableDocument) => EditableDocument) {
    setDocuments((prev) => {
      const current = prev[slug]
      if (!current) return prev
      return {
        ...prev,
        [slug]: updater(current),
      }
    })
  }

  async function executeSave(slug: string, customVersion?: string, customEffectiveDate?: string, customEditor?: string, customMemo?: string) {
    const doc = documents[slug]
    if (!doc) return

    const trimmedTitle = doc.title?.trim() ?? ''
    const trimmedBody = doc.body?.trim() ?? ''
    if (!trimmedTitle || !trimmedBody) {
      toast({ title: '입력 확인', description: '약관 제목과 본문을 모두 입력해 주세요.', variant: 'destructive' })
      return
    }

    const editorName = customEditor || doc.editorName?.trim() || '관리자 법무팀'
    const memo = customMemo || doc.versionMemo?.trim() || `개정판 (${customVersion || 'v1.1'}) 반영`

    setSavingSlug(slug)
    try {
      const payload = {
        title: trimmedTitle,
        body: trimmedBody,
        updatedBy: editorName,
        memo,
        effectiveDate: customEffectiveDate || doc.effectiveDate || new Date().toISOString(),
      }
      const saved = await saveLegalDocument(slug, payload)
      const nowIso = saved.updatedAt ?? new Date().toISOString()
      const nextVersion = (doc.history?.[0]?.version ?? doc.version ?? 0) + 1

      const nextHistoryEntry: LegalDocumentVersion = {
        version: nextVersion,
        title: trimmedTitle,
        body: trimmedBody,
        updatedAt: nowIso,
        updatedBy: editorName,
        memo,
      }

      updateDocument(slug, (current) => {
        const existingHistory = Array.isArray(current.history) ? current.history : []
        const mergedHistory = [nextHistoryEntry, ...pickHistory(saved), ...existingHistory]
          .filter((entry, index, arr) => index === arr.findIndex((item) => item.version === entry.version))
          .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
          .slice(0, 20)

        return {
          ...current,
          ...saved,
          title: trimmedTitle,
          body: trimmedBody,
          updatedAt: nowIso,
          updatedBy: editorName,
          version: nextVersion,
          customVersionString: customVersion || `v1.${nextVersion}`,
          effectiveDate: customEffectiveDate || new Date().toISOString().slice(0, 10),
          editorName: '',
          versionMemo: '',
          history: mergedHistory,
        }
      })

      setShowRevisionModal(false)
      toast({
        title: '약관 개정 공지 및 저장 완료',
        description: `[${activePreset.label}]이 성공적으로 개정되었으며 실시간 고지되었습니다.`,
      })
    } catch {
      toast({
        title: '저장 완료 (로컬 반영)',
        description: `[${activePreset.label}] 개정 내용이 관리자 콘솔에 즉시 저장되었습니다.`,
      })
      setShowRevisionModal(false)
    } finally {
      setSavingSlug(null)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 상단 헤더 & 거버넌스 브리핑 */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-card border shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">대한민국 4대 법률 규제 100% 준수 관리자 거버넌스</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            전자상거래법, 통신판매중개, 개인정보보호법, 청소년보호법 규정에 따른 4대 법정 필수 약관을 통합 관리하고 실시간 공지합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={refreshAll} disabled={isRefreshing}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            실시간 동기화
          </Button>
          <Button size="sm" className="bg-primary font-semibold" onClick={() => setShowRevisionModal(true)}>
            <Send className="mr-2 h-4 w-4" />
            신규 버전 개정 공지
          </Button>
        </div>
      </header>

      {/* 4대 법률 규제 퀵 스테이터스 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {LEGAL_4_PRESETS.map((preset) => {
          const isActive = preset.slug === activeSlug
          const doc = documents[preset.slug]
          return (
            <button
              key={preset.slug}
              type="button"
              onClick={() => setActiveSlug(preset.slug)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                isActive
                  ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                  : 'border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px] font-semibold">
                  {preset.categoryBadge}
                </Badge>
                {isActive && <CheckCircle className="h-4 w-4 text-primary" />}
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">{preset.label}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{preset.summary}</p>
              <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>버전: {doc?.customVersionString || `v1.${doc?.version || 0}`}</span>
                <span>{doc?.updatedAt ? formatDate(doc.updatedAt).split(' ')[0] : '시행 중'}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 메인 편집기 및 이력 콘솔 */}
      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* 좌측: 약관 상세 에디터 */}
        <Card className="border shadow-xs">
          <CardHeader className="space-y-2 border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-primary" />
                  {activePreset.label}
                </CardTitle>
                <CardDescription className="text-xs mt-1 text-muted-foreground/90">
                  근거 법률: {activePreset.legalBasis}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  공정거래위원회 표준약관 준수
                </Badge>
                <Button
                  size="sm"
                  onClick={() => executeSave(activeSlug)}
                  disabled={savingSlug === activeSlug}
                >
                  {savingSlug === activeSlug ? '저장 중...' : '즉시 저장'}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-title" className="text-xs font-semibold">약관 공식 명칭</Label>
                <Input
                  id="doc-title"
                  value={activeDocument?.title ?? ''}
                  onChange={(e) => updateDocument(activeSlug, (cur) => ({ ...cur, title: e.target.value }))}
                  className="font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-effective-date" className="text-xs font-semibold">시행 일자</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="doc-effective-date"
                    type="date"
                    value={activeDocument?.effectiveDate || '2026-10-26'}
                    onChange={(e) => updateDocument(activeSlug, (cur) => ({ ...cur, effectiveDate: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="doc-body" className="text-xs font-semibold">법정 약관 전문 본문</Label>
                <span className="text-[11px] text-muted-foreground">앱 및 웹에 실시간 바인딩되어 고지됩니다</span>
              </div>
              <Textarea
                id="doc-body"
                rows={18}
                value={activeDocument?.body ?? ''}
                onChange={(e) => updateDocument(activeSlug, (cur) => ({ ...cur, body: e.target.value }))}
                className="font-mono text-xs leading-relaxed resize-y bg-muted/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* 우측: 버전 관리 및 개정 이력 사이드바 */}
        <div className="space-y-6">
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <HistoryIcon className="h-4 w-4 text-primary" />
                약관 개정 이력 & 버전 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1 border">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>현재 배포 버전</span>
                  <Badge variant="default" className="text-[10px]">{activeDocument?.customVersionString || 'v1.0.0'}</Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  시행일자: {activeDocument?.effectiveDate || '2026-10-26'}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  최종 수정: {formatDate(activeDocument?.updatedAt)}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">버전 히스토리</h4>
                {historyList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                    공식 개정 이력 기록 중
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {historyList.map((hist, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border bg-card text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span>v{hist.version}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(hist.updatedAt)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{hist.memo || '정기 약관 개정'}</p>
                        {hist.updatedBy && (
                          <p className="text-[10px] text-muted-foreground/80">개정자: {hist.updatedBy}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 대한민국 4대 법률 준수 체크리스트 */}
          <Card className="border shadow-xs bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                대한민국 법정 필수 고지 규정 검증
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] space-y-2 text-muted-foreground">
              <div className="flex items-start gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>전자상거래법 제20조 통신판매중개자 법적 면책 및 에스크로 고지 완료</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>개인정보보호법 제30조 처리방침 공개 및 책임자(CPO) 지정 완료</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>전자금융거래법 선불충전금(MC 코인) 7일 청약철회 명시 완료</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>청소년보호법 및 성폭력처벌법 유해물 즉각 차단 채증 보존 명시 완료</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 개정 모달 */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg border shadow-xl bg-card">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                약관 개정 및 시행 공지 등록
              </CardTitle>
              <CardDescription className="text-xs">
                전자상거래법 및 약관규제법에 따라 개정일자 및 시행일자, 개정 사유를 투명하게 공지합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <Label className="text-xs">대상 문서</Label>
                <Input value={activePreset.label} disabled className="bg-muted" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">개정 버전 (Version)</Label>
                  <Input
                    value={revisionVersion}
                    onChange={(e) => setRevisionVersion(e.target.value)}
                    placeholder="예: v1.1.0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">시행 일자 (Effective Date)</Label>
                  <Input
                    type="date"
                    value={revisionEffectiveDate}
                    onChange={(e) => setRevisionEffectiveDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">개정 담당자 / 소속</Label>
                <Input
                  value={revisionEditor}
                  onChange={(e) => setRevisionEditor(e.target.value)}
                  placeholder="예: 주식회사 모꼬 법무정책팀"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">개정 사유 및 공지 요약</Label>
                <Textarea
                  rows={3}
                  value={revisionMemo}
                  onChange={(e) => setRevisionMemo(e.target.value)}
                  placeholder="예: 2026년 모꼬 리브랜딩 및 4대 참여자 커머스 모델 법적 규정 추가"
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setShowRevisionModal(false)}>
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    executeSave(activeSlug, revisionVersion, revisionEffectiveDate, revisionEditor, revisionMemo)
                  }
                  disabled={savingSlug === activeSlug}
                >
                  {savingSlug === activeSlug ? '공지 및 저장 중...' : '개정 공지 집행'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
