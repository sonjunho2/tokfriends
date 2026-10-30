'use client'

import React, { useState } from 'react'
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Receipt,
  Lock,
  Smartphone,
  Building,
  Check,
} from 'lucide-react'
import { useWebAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface PointPackage {
  id: string
  points: number
  bonus: number
  price: number
  badge: string | null
  recommended?: boolean
}

// 모바일 앱 PointChargeScreen.js와 100% 동일한 7대 표준 패키지
export const POINT_PACKAGES: PointPackage[] = [
  {
    id: 'pkg-1000',
    points: 1000,
    bonus: 0,
    price: 1100,
    badge: null,
  },
  {
    id: 'pkg-3000',
    points: 3000,
    bonus: 0,
    price: 3300,
    badge: null,
  },
  {
    id: 'pkg-5000',
    points: 5000,
    bonus: 250,
    price: 5500,
    badge: '인기',
  },
  {
    id: 'pkg-10000',
    points: 10000,
    bonus: 1000,
    price: 11000,
    badge: 'HOT 추천',
    recommended: true,
  },
  {
    id: 'pkg-30000',
    points: 30000,
    bonus: 3500,
    price: 33000,
    badge: '혜택 +11%',
  },
  {
    id: 'pkg-50000',
    points: 50000,
    bonus: 7000,
    price: 55000,
    badge: '혜택 +14%',
  },
  {
    id: 'pkg-100000',
    points: 100000,
    bonus: 18000,
    price: 110000,
    badge: 'VIP 최대혜택',
  },
]

export const PAYMENT_METHODS = [
  {
    id: 'kakaopay',
    name: '카카오페이',
    desc: '카카오톡 1초 간편결제',
    iconColor: 'bg-[#FEE500] text-[#191919]',
    badge: '간편결제',
    tag: '💛',
  },
  {
    id: 'naverpay',
    name: '네이버페이',
    desc: '네이버페이 포인트 적립',
    iconColor: 'bg-[#03C75A] text-white',
    badge: '간편결제',
    tag: '💚',
  },
  {
    id: 'tosspay',
    name: '토스페이',
    desc: '토스 앱 바로결제',
    iconColor: 'bg-[#0064FF] text-white',
    badge: '간편결제',
    tag: '💙',
  },
  {
    id: 'card',
    name: '신용/체크카드',
    desc: '국민, 신한, 삼성, 현대 등 전 카드사',
    iconColor: 'bg-slate-800 text-white',
    badge: '일반결제',
    tag: '💳',
  },
  {
    id: 'phone',
    name: '휴대폰 결제',
    desc: '통신 3사 소액결제',
    iconColor: 'bg-neutral-700 text-white',
    badge: '통신사',
    tag: '📱',
  },
  {
    id: 'bank',
    name: '실시간 계좌이체',
    desc: '전국 은행 에스크로 안심이체',
    iconColor: 'bg-emerald-700 text-white',
    badge: '에스크로',
    tag: '🏦',
  },
]

interface MoccoPointChargeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (chargedPoints: number, newBalance: number) => void
}

export function MoccoPointChargeModal({
  isOpen,
  onClose,
  onSuccess,
}: MoccoPointChargeModalProps) {
  const { user, rechargePoints } = useWebAuth()
  const { toast } = useToast()

  const [selectedPackage, setSelectedPackage] = useState<PointPackage>(POINT_PACKAGES[3])
  const [selectedMethod, setSelectedMethod] = useState<string>('kakaopay')
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true)

  // Payment Processing States: 'SELECT' | 'PROCESSING' | 'SUCCESS'
  const [step, setStep] = useState<'SELECT' | 'PROCESSING' | 'SUCCESS'>('SELECT')
  const [receiptData, setReceiptData] = useState<{
    orderId: string
    chargedPoints: number
    amount: number
    paymentMethodName: string
    paidAt: string
    newBalance: number
  } | null>(null)

  if (!isOpen) return null

  const currentPoints = user?.pointBalance ?? 0
  const totalPointsToAdd = selectedPackage.points + selectedPackage.bonus
  const expectedPoints = currentPoints + totalPointsToAdd

  const handleStartPayment = async () => {
    if (!agreedTerms) {
      toast({
        title: '약관 동의 필요',
        description: '전자금융거래 이용약관 및 결제정보 제공에 동의해 주세요.',
        variant: 'destructive',
      })
      return
    }

    setStep('PROCESSING')

    const methodName =
      PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.name || '간편결제'

    // Simulate PG payment authentication latency (1.2s)
    setTimeout(async () => {
      try {
        const result = await rechargePoints(
          totalPointsToAdd,
          selectedPackage.price,
          methodName,
          selectedPackage.id
        )

        const receipt = {
          orderId: result.transactionId || `MOC-${Date.now()}`,
          chargedPoints: totalPointsToAdd,
          amount: selectedPackage.price,
          paymentMethodName: methodName,
          paidAt: new Date().toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          newBalance: result.newBalance,
        }

        setReceiptData(receipt)
        setStep('SUCCESS')

        if (onSuccess) {
          onSuccess(totalPointsToAdd, result.newBalance)
        }

        toast({
          title: `🎉 ${totalPointsToAdd.toLocaleString()} P 충전 완료!`,
          description: `결제가 정상 승인되어 모꼬 포인트가 즉시 지급되었습니다.`,
        })
      } catch (err: any) {
        toast({
          title: '결제 처리 중 오류 발생',
          description: err?.message || '결제 승인에 실패했습니다. 다시 시도해 주세요.',
          variant: 'destructive',
        })
        setStep('SELECT')
      }
    }, 1200)
  }

  const handleClose = () => {
    setStep('SELECT')
    setReceiptData(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/80 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>모꼬 포인트 충전소</span>
                <Badge className="bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px]">
                  웹·앱 실시간 100% 연동
                </Badge>
              </h3>
              <p className="text-[11px] text-neutral-400">
                라이브 방송 후원, 1:1 대화 및 선물 보내기에 사용하는 공식 모꼬 포인트입니다
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {step === 'SELECT' && (
            <>
              {/* My Balance Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-neutral-800/60 border border-pink-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 font-medium">현재 보유 포인트</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-pink-400">
                      {currentPoints.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-neutral-300">P</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <ArrowRight className="w-4 h-4 text-neutral-500" />
                  <div>
                    <span className="text-xs text-emerald-400 font-bold">충전 후 예상 잔액</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-emerald-300">
                        {expectedPoints.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-neutral-300">P</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Select Grid */}
              <div>
                <label className="block text-xs font-bold text-white mb-2.5 flex items-center justify-between">
                  <span>1. 충전 포인트 패키지 선택</span>
                  <span className="text-[11px] font-normal text-neutral-400">
                    모바일 앱과 100% 동일한 혜택가
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POINT_PACKAGES.map((pkg) => {
                    const isSelected = selectedPackage.id === pkg.id
                    const pkgTotal = pkg.points + pkg.bonus
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-pink-950/40 border-pink-500 ring-2 ring-pink-500/50 shadow-lg shadow-pink-950/30'
                            : 'bg-neutral-800/60 border-neutral-700/80 hover:border-neutral-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-pink-500 bg-pink-600 text-white'
                                : 'border-neutral-600'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-extrabold text-white">
                                {pkgTotal.toLocaleString()} P
                              </span>
                              {pkg.badge && (
                                <span className="bg-pink-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                                  {pkg.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                              기본 {pkg.points.toLocaleString()} P
                              {pkg.bonus > 0 && (
                                <span className="text-amber-400 font-bold ml-1">
                                  (+보너스 {pkg.bonus.toLocaleString()} P)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-white">
                            ₩{pkg.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-neutral-400 block">부가세 포함</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-white mb-2.5">
                  2. 결제 수단 선택
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod === method.id
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-neutral-800 border-pink-500 ring-1 ring-pink-500 text-white'
                            : 'bg-neutral-800/40 border-neutral-700/60 hover:border-neutral-600 text-neutral-300'
                        }`}
                      >
                        <span className="text-lg">{method.tag}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate flex items-center gap-1">
                            <span>{method.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 truncate block">
                            {method.desc}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Terms and Safe Deal Notice */}
              <div className="p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="rounded text-pink-600 focus:ring-0"
                  />
                  <span className="text-xs text-neutral-300 font-medium">
                    (필수) 전자금융거래 기본약관 및 결제 정보 제3자 제공 동의
                  </span>
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 pl-5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    토스페이먼츠 및 카카오페이 안전결제 암호화 시스템으로 100% 안전하게 보호됩니다.
                  </span>
                </div>
              </div>
            </>
          )}

          {step === 'PROCESSING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin" />
                <Lock className="w-6 h-6 text-pink-400 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">결제 승인 처리 중...</h4>
                <p className="text-xs text-neutral-400">
                  {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.name}의 안전 결제 게이트웨이와
                  통신하고 있습니다.
                  <br />
                  잠시만 기다려 주세요. (창을 닫지 마세요)
                </p>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && receiptData && (
            <div className="py-4 space-y-6">
              {/* Top Banner */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-white">모꼬 포인트 충전이 완료되었습니다!</h4>
                <p className="text-xs text-neutral-300">
                  결제가 정상 완료되어 포인트 잔액이 즉시 반영되었습니다.
                </p>
              </div>

              {/* Electronic Receipt */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-3 font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      전자 영수증 (영구 보관)
                    </span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                    결제 정상 승인
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">주문(승인) 번호</span>
                    <span className="text-white font-bold">{receiptData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">결제 일시</span>
                    <span className="text-neutral-200">{receiptData.paidAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">결제 수단</span>
                    <span className="text-white font-bold">{receiptData.paymentMethodName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">결제 승인 금액</span>
                    <span className="text-white font-bold">
                      ₩{receiptData.amount.toLocaleString()} (VAT 포함)
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-800">
                    <span className="text-pink-400 font-bold">충전 지급 포인트</span>
                    <span className="text-pink-400 font-black text-sm">
                      +{receiptData.chargedPoints.toLocaleString()} P
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-400 font-bold">최종 보유 잔액</span>
                    <span className="text-emerald-300 font-black text-sm">
                      {receiptData.newBalance.toLocaleString()} P
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-500 flex justify-between items-center font-sans">
                  <span>가맹점: (주)모꼬글로벌 (사업자 123-86-12345)</span>
                  <span>고객센터: 1588-0000</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
          {step === 'SELECT' && (
            <>
              <div className="flex flex-col">
                <span className="text-[11px] text-neutral-400">최종 결제 금액</span>
                <span className="text-lg font-black text-white">
                  ₩{selectedPackage.price.toLocaleString()}
                  <span className="text-xs font-normal text-neutral-400 ml-1">원</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-neutral-700 text-neutral-300 hover:text-white text-xs px-4"
                >
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={handleStartPayment}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs px-7 h-10 shadow-lg shadow-pink-600/30 rounded-xl"
                >
                  ₩{selectedPackage.price.toLocaleString()}원 결제하기
                </Button>
              </div>
            </>
          )}

          {step === 'SUCCESS' && (
            <Button
              type="button"
              onClick={handleClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl"
            >
              확인 및 포인트 사용하기
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

