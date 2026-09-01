'use client'

import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, FileText, History as HistoryIcon, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  getLegalDocument,
  saveLegalDocument,
  type LegalDocument,
  type LegalDocumentVersion,
} from '@/lib/api'

interface DocumentPreset {
  slug: string
  label: string
  summary: string
  fallbackTitle: string
  fallbackBody: string
}

interface EditableDocument extends LegalDocument {
  editorName: string
  versionMemo: string
  isLoading: boolean
}

const DOCUMENT_PRESETS: DocumentPreset[] = [
  {
    slug: 'privacy-policy',
    label: '개인정보처리방침',
    summary: '수집 항목, 이용 목적, 보관 기간, 제3자 제공 현황을 최신으로 유지하세요.',
    fallbackTitle: 'TokFriends 개인정보 처리방침',
    fallbackBody:
      'TokFriends는 회원님의 개인정보를 안전하게 관리하기 위해 관련 법령과 내부 보안 정책을 준수합니다.\n\n1. 수집 항목: 필수(전화번호, 닉네임, 생년월일), 선택(관심사, 위치)\n2. 이용 목적: 매칭 추천, 고객 지원, 부정행위 방지\n3. 보관 및 파기: 탈퇴 후 30일 내 파기, 법령상 보관 예외 존재.\n\n자세한 내용은 관리 콘솔에서 항목별로 갱신하세요.',
  },
  {
    slug: 'terms-of-service',
    label: '이용약관',
    summary: '서비스 이용 조건, 금지 행위, 책임 제한 조항을 점검합니다.',
    fallbackTitle: 'TokFriends 이용약관',
    fallbackBody:
      'TokFriends를 이용해 주셔서 감사합니다. 본 약관은 TokFriends가 제공하는 모든 서비스에 적용됩니다.\n\n1. 계정 생성 및 관리\n2. 서비스 이용 시 주의사항과 금지 행위\n3. 유료 상품 및 환불 정책\n4. 면책 조항 및 분쟁 해결\n\n정책 변경 시 고객에게 사전 공지하고 개별 동의를 다시 받아야 합니다.',
  },
  {
    slug: 'location-based-service',
    label: '위치기반서비스 이용약관',
    summary: '실시간 위치정보 수집·이용 및 보호조치, 신고 대응 절차를 포함하세요.',
    fallbackTitle: 'TokFriends 위치기반서비스 이용약관',
    fallbackBody:
      'TokFriends는 정확한 매칭을 위해 회원님의 위치기반 서비스를 제공합니다.\n\n1. 위치정보의 수집 방법과 주기\n2. 이용 목적 및 보유 기간\n3. 보호조치, 이용자의 권리와 행사 방법\n4. 위치정보 관리자 및 연락처\n\n관련 법령의 요구사항을 충족하도록 세부 항목을 갱신하세요.',
  },
]

type DocumentMap = Record<string, EditableDocument>

const INITIAL_DOCUMENTS: DocumentMap = DOCUMENT_PRESETS.reduce((acc, preset) => {
  acc[preset.slug] = {
    slug: preset.slug,
    title: preset.fallbackTitle,
    body: preset.fallbackBody,
    editorName: '',
    versionMemo: '',
    history: [],
    isLoading: false,
  }
  return acc
}, {} as DocumentMap)

function formatDate(value?: string | null) {
  if (!value) return '아직 저장되지 않았습니다.'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return `${date.toLocaleString()} (UTC${(date.getTimezoneOffset() / -60).toString().padStart(2, '0')})`
}

function pickHistory(document: LegalDocument): LegalDocumentVersion[] {
  if (!document) return []
  if (Array.isArray(document.history) && document.history.length > 0) {
    return document.history as LegalDocumentVersion[]
  }
  if (Array.isArray((document as any).versions)) {
    return (document as any).versions as LegalDocumentVersion[]
  }
  if (Array.isArray((document as any).revisions)) {
    return (document as any).revisions as LegalDocumentVersion[]
  }
  return []
}

export default function LegalDocumentsPage() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentMap>(INITIAL_DOCUMENTS)
  const [activeSlug, setActiveSlug] = useState<string>(DOCUMENT_PRESETS[0]?.slug ?? '')
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const activeDocument = documents[activeSlug]

  const historyList = useMemo(() => {
    return activeDocument?.history ?? []
  }, [activeDocument])

  useEffect(() => {
    void refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshAll() {
    setIsRefreshing(true)
    try {
      await Promise.all(
        DOCUMENT_PRESETS.map(async (preset) => {
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
        ...prev[slug],
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
          editorName: '',
          versionMemo: '',
          history: pickHistory(data).sort((a, b) => (b.version ?? 0) - (a.version ?? 0)).slice(0, 15),
          isLoading: false,
        },
      }))
    } catch (error) {
      setDocuments((prev) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          isLoading: false,
        },
      }))
      toast({
        title: '약관을 불러오지 못했습니다',
        description: '네트워크 상태를 확인하고 다시 시도하세요. 임시로 기본 문안을 표시합니다.',
        variant: 'destructive',
      })
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

  async function handleSave(slug: string) {
    const doc = documents[slug]
    if (!doc) return

    const trimmedTitle = doc.title?.trim() ?? ''
    if (!trimmedTitle) {
      toast({ title: '제목 필요', description: '약관 제목을 입력하세요.', variant: 'destructive' })
      return
    }
    const trimmedBody = doc.body?.trim() ?? ''
    if (!trimmedBody) {
      toast({ title: '본문 필요', description: '약관 본문을 입력하세요.', variant: 'destructive' })
      return
    }

    const normalizedEditorName = doc.editorName?.trim() ?? ''
    const normalizedUpdatedBy = normalizedEditorName || doc.updatedBy?.trim() || undefined
    const normalizedMemo = doc.versionMemo?.trim() || undefined

    setSavingSlug(slug)
    try {
      const payload = {
        title: trimmedTitle,
        body: trimmedBody,
        updatedBy: normalizedUpdatedBy,
        memo: normalizedMemo,
      }
      const saved = await saveLegalDocument(slug, payload)
      const nowIso = saved.updatedAt ?? new Date().toISOString()
      const savedUpdatedBy = saved.updatedBy?.trim() || undefined
      const editorName =
        normalizedUpdatedBy ?? savedUpdatedBy ?? doc.updatedBy?.trim() ?? null
      const persistedTitle = saved.title ?? trimmedTitle
      const persistedBody = saved.body ?? trimmedBody
      const nextVersion = (doc.history?.[0]?.version ?? doc.version ?? 0) + 1
      const nextHistoryEntry: LegalDocumentVersion = {
        version: nextVersion,
        title: persistedTitle,
        body: persistedBody,
        updatedAt: nowIso,
        updatedBy: editorName,
        memo: payload.memo,
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
          title: persistedTitle,
          body: persistedBody,
          updatedAt: nowIso,
          updatedBy: editorName,
          version: nextVersion,
          editorName: '',
          versionMemo: '',
          history: mergedHistory,
        }
      })

      const preset = DOCUMENT_PRESETS.find((item) => item.slug === slug)
      toast({
        title: '약관이 저장되었습니다',
        description: `${preset?.label ?? '문서'}의 버전 기록이 업데이트되었습니다.`,
      })
    } catch (error) {
      toast({ title: '저장 실패', description: '서버에 변경사항을 반영하지 못했습니다. 다시 시도하세요.', variant: 'destructive' })
    } finally {
      setSavingSlug(null)
    }
  }

  const activePreset = DOCUMENT_PRESETS.find((preset) => preset.slug === activeSlug)

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">약관 관리</h1>
        <p className="text-sm text-muted-foreground">
          정책 변경 시 앱과 백엔드의 동의 버전이 일치하도록 제목과 본문을 저장하세요. 저장 시 /legal-documents/{activeSlug}
          엔드포인트로 실시간 반영됩니다.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> 저장 시 자동으로 버전 이력을 쌓습니다.</span>
          <Button size="sm" variant="outline" onClick={refreshAll} disabled={isRefreshing}>
            <RefreshCcw className="mr-1 h-4 w-4" />
            새로고침
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[240px,1fr]">
        <aside className="space-y-2">
          {DOCUMENT_PRESETS.map((preset) => {
            const isActive = preset.slug === activeSlug
            const doc = documents[preset.slug]
            return (
              <button
                key={preset.slug}
                type="button"
                onClick={() => setActiveSlug(preset.slug)}
                className={`w-full rounded-md border px-3 py-2 text-left transition ${
                  isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/60'
                }`}
              >
                <p className="text-sm font-semibold">{preset.label}</p>
                <p className="text-xs text-muted-foreground">{doc?.updatedAt ? `최근 수정 ${formatDate(doc.updatedAt)}` : '초안 상태'}</p>
              </button>
            )
          })}
        </aside>

        {activeDocument ? (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                {activePreset?.label}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{activePreset?.summary}</p>
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">API 경로</span> : /legal-documents/{activeDocument.slug}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>최근 수정일: {formatDate(activeDocument.updatedAt)}</span>
                {activeDocument.updatedBy && <span>최근 수정자: {activeDocument.updatedBy}</span>}
                {typeof activeDocument.version === 'number' && activeDocument.version > 0 && (
                  <span>현재 버전: v{activeDocument.version}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <Label htmlFor="doc-title">제목</Label>
                <Input
                  id="doc-title"
                  value={activeDocument.title ?? ''}
                  onChange={(event) =>
                    updateDocument(activeSlug, (current) => ({ ...current, title: event.target.value }))
                  }
                  disabled={activeDocument.isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-editor">수정자 메모</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    id="doc-editor"
                    placeholder="최근 수정자 이름/팀"
                    value={activeDocument.editorName}
                    onChange={(event) =>
                      updateDocument(activeSlug, (current) => ({ ...current, editorName: event.target.value }))
                    }
                    disabled={activeDocument.isLoading}
                  />
                  <Input
                    placeholder="버전 메모 (예: 2024-04 약관 개정)"
                    value={activeDocument.versionMemo}
                    onChange={(event) =>
                      updateDocument(activeSlug, (current) => ({ ...current, versionMemo: event.target.value }))
                    }
                    disabled={activeDocument.isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-body">본문 (Markdown 지원)</Label>
                <Textarea
                  id="doc-body"
                  rows={18}
                  value={activeDocument.body ?? ''}
                  onChange={(event) =>
                    updateDocument(activeSlug, (current) => ({ ...current, body: event.target.value }))
                  }
                  className="font-mono text-xs"
                  disabled={activeDocument.isLoading}
                />
                <div className="rounded-md border bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">미리보기</p>
                  <div className="whitespace-pre-wrap break-words text-muted-foreground">{activeDocument.body}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => handleSave(activeSlug)}
                  disabled={savingSlug === activeSlug || activeDocument.isLoading}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" /> 저장 후 버전 기록 남기기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadDocument(activeSlug)}
                  disabled={activeDocument.isLoading || savingSlug === activeSlug}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> 이 문서만 새로고침
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <HistoryIcon className="h-4 w-4" /> 최근 버전 이력
                </div>
                {historyList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">아직 저장된 이력이 없습니다.</p>
                ) : (
                  <ul className="space-y-3 text-xs">
                    {historyList.map((entry) => (
                      <li key={entry.version} className="rounded-md border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">v{entry.version}</span>
                          <span className="text-muted-foreground">{formatDate(entry.updatedAt)}</span>
                        </div>
                        {entry.updatedBy && (
                          <p className="mt-1 text-muted-foreground">수정자: {entry.updatedBy}</p>
                        )}
                        {entry.memo && (
                          <p className="mt-1 italic text-muted-foreground">메모: {entry.memo}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              문서를 선택해 상세 내용을 확인하세요.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
