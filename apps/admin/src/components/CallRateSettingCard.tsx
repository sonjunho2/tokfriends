'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Video,
  Coins,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
  Save,
  Clock,
  Calculator,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  getCallRateSetting,
  updateCallRateSetting,
  type CallRateSetting,
} from '@/lib/api'
import type { AxiosError } from 'axios'
import { cn } from '@/lib/utils'

interface CallRateSettingCardProps {
  className?: string
  initialData?: CallRateSetting | null
  onUpdated?: (updated: CallRateSetting) => void
}

export function CallRateSettingCard({
  className,
  initialData,
  onUpdated,
}: CallRateSettingCardProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [setting, setSetting] = useState<CallRateSetting | null>(initialData ?? null)
  const [rateInput, setRateInput] = useState<number>(initialData?.ratePerMinute ?? 1500)
  const [descriptionInput, setDescriptionInput] = useState<string>(
    initialData?.description ?? '1:1 영상 통화 기본 분당 요금(포인트)'
  )

  const isDirty = useMemo(() => {
    if (!setting) return false
    return (
      rateInput !== setting.ratePerMinute ||
      descriptionInput !== (setting.description ?? '')
    )
  }, [setting, rateInput, descriptionInput])

  const fetchSetting = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCallRateSetting()
      setSetting(data)
      setRateInput(data.ratePerMinute)
      setDescriptionInput(data.description ?? '1:1 영상 통화 기본 분당 요금(포인트)')
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message ||
        ax?.message ||
        '통화 요금 설정을 불러오지 못했습니다.'
      toast({
        title: '요금 설정 조회 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!initialData) {
      fetchSetting()
    } else {
      setSetting(initialData)
      setRateInput(initialData.ratePerMinute)
      setDescriptionInput(initialData.description ?? '1:1 영상 통화 기본 분당 요금(포인트)')
    }
  }, [initialData, fetchSetting])

  const handleSave = async () => {
    if (rateInput < 0 || isNaN(rateInput)) {
      toast({
        title: '입력값 오류',
        description: '분당 요금은 0 포인트 이상의 정수여야 합니다.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateCallRateSetting({
        ratePerMinute: rateInput,
        description: descriptionInput.trim(),
      })
      setSetting(updated)
      setRateInput(updated.ratePerMinute)
      setDescriptionInput(updated.description ?? '')
      if (onUpdated) {
        onUpdated(updated)
      }
      toast({
        title: '1:1 통화 요금 정책 저장 완료',
        description: `기본 분당 요금이 ${updated.ratePerMinute.toLocaleString()}P 로 성공적으로 반영되었습니다.`,
      })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message ||
        ax?.message ||
        '요금 설정을 저장하지 못했습니다.'
      toast({
        title: '저장 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetToDefault = () => {
    setRateInput(1500)
  }

  const addAmount = (amount: number) => {
    setRateInput((prev) => Math.max(0, prev + amount))
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-rose-200/80 bg-gradient-to-br from-card via-card to-rose-500/5 shadow-md dark:border-rose-900/50',
        className
      )}
    >
      {/* 장식용 글로우 효과 */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

      <CardHeader className="border-b bg-rose-500/5 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20">
                <Video className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                1:1 영상 통화 기본 분당 요금(포인트)
              </CardTitle>
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <Sparkles className="h-3 w-3" />
                동적 Fallback 정책
              </span>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              호스트 사용자에게 개별 설정 단가가 없을 때 적용되는 시스템 기본 분당 요금(포인트)입니다.
              1:1 통화 시작 시 본 설정값이 fallback으로 자동 적용되어 발신자 계정에서 차감됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchSetting}
              disabled={isLoading || isSaving}
              className="h-8 gap-1 text-xs"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
              새로고침
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className={cn(
                'h-9 gap-1.5 px-4 font-semibold text-white shadow-sm transition',
                isDirty
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 ring-2 ring-rose-500/40'
                  : 'bg-primary hover:bg-primary/90'
              )}
            >
              <Save className="h-4 w-4" />
              {isSaving ? '저장 중...' : isDirty ? '변경사항 저장' : '설정 저장'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* 좌측: 요금 입력 폼 */}
          <div className="space-y-4 lg:col-span-7">
            <div className="rounded-xl border bg-background/60 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between pb-2">
                <Label htmlFor="call-rate-input" className="text-sm font-semibold text-foreground">
                  기본 분당 통화 요금
                </Label>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                  현재 적용:
                  <span className="font-bold text-foreground">
                    {setting ? setting.ratePerMinute.toLocaleString() : '1,500'} P / 분
                  </span>
                </div>
              </div>

              {/* 입력 인풋 */}
              <div className="relative mt-1">
                <Input
                  id="call-rate-input"
                  type="number"
                  min={0}
                  step={100}
                  value={rateInput}
                  onChange={(e) => setRateInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="1500"
                  className="h-12 pr-16 text-right font-mono text-xl font-bold tracking-tight shadow-inner"
                />
                <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
                  <span>P / 분</span>
                </div>
              </div>

              {/* 빠른 증감 및 프리셋 버튼 */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted-foreground">빠른 조정:</span>
                {[100, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAmount(amount)}
                    className="h-7 px-2.5 text-xs hover:border-rose-400 hover:bg-rose-500/10 hover:text-rose-600"
                  >
                    +{amount.toLocaleString()}P
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetToDefault}
                  className="h-7 px-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                >
                  기본값 복원 (1,500P)
                </Button>
              </div>
            </div>

            {/* 정책 설명 / 운영 메모 */}
            <div className="rounded-xl border bg-background/60 p-4 shadow-sm backdrop-blur-sm">
              <Label htmlFor="call-rate-desc" className="text-sm font-semibold text-foreground">
                정책 설명 및 운영 메모
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                관리자 감사 로그 및 시스템 설정 상세 정보에 함께 기록됩니다.
              </p>
              <Input
                id="call-rate-desc"
                type="text"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="1:1 영상 통화 기본 분당 요금(포인트)"
                className="mt-2 h-10 text-sm"
              />
            </div>
          </div>

          {/* 우측: 실시간 예상 차감 시뮬레이터 카드 */}
          <div className="flex flex-col justify-between rounded-xl border border-rose-200/50 bg-gradient-to-b from-rose-50/50 to-background p-4 shadow-sm dark:border-rose-900/30 dark:from-rose-950/20 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Calculator className="h-4 w-4 text-rose-500" />
                통화 시간별 예상 포인트 차감 시뮬레이터
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                현재 입력된 <span className="font-semibold text-rose-600 dark:text-rose-400">{rateInput.toLocaleString()} P/분</span> 기준으로 유저에게 차감될 예상 포인트입니다.
              </p>

              <div className="mt-3.5 space-y-2">
                {[
                  { label: '5분 통화', min: 5 },
                  { label: '10분 통화', min: 10 },
                  { label: '30분 통화', min: 30 },
                  { label: '60분 (1시간)', min: 60 },
                ].map(({ label, min }) => {
                  const cost = rateInput * min
                  return (
                    <div
                      key={min}
                      className="flex items-center justify-between rounded-lg border bg-card/80 px-3 py-2 text-xs backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{label}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono font-bold text-rose-600 dark:text-rose-400">
                        <span>{cost.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground">P</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                <strong>호스트 개별 단가 우선:</strong> 호스트가 프로필에서 개별 단가를 지정한 경우 호스트 단가가 우선 적용되며, 설정하지 않은 호스트에게만 본 기본 요금이 적용됩니다.
              </span>
            </div>
          </div>
        </div>

        {/* 상태 바 */}
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              DB 키: <code className="font-mono text-foreground font-semibold">DEFAULT_CALL_RATE_PER_MINUTE</code>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>
              최종 저장 상태:{' '}
              {isDirty ? (
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  수정됨 (미저장)
                </span>
              ) : (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  동기화 완료
                </span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
