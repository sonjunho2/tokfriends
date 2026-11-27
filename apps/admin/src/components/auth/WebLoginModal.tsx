'use client'

import React, { useState } from 'react'
import { X, Mail, Lock, User, Check, ChevronDown, ChevronUp, ShieldCheck, Sparkles } from 'lucide-react'
import { useWebAuth, type ConsentPayload } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'

const TERM_DETAILS: Record<string, { title: string; body: string }> = {
  tos: {
    title: '모꼬 서비스 이용약관',
    body: '제1조 (목적) 본 약관은 주식회사 모꼬글로벌이 운영하는 모꼬(MOCCO) 서비스의 이용조건 및 절차, 이용자와 회사의 권리·의무 및 책임사항을 규정합니다.\n제2조 (서비스 제공) 실시간 라이브 방송, 이웃 소통, 중고 안전거래(에스크로) 및 커머스 서비스를 제공합니다.',
  },
  privacy: {
    title: '개인정보 수집 및 이용 동의',
    body: '1. 수집 항목: 이메일, 비밀번호(암호화 저장), 닉네임, 서비스 이용기록.\n2. 이용 목적: 회원 식별, 안전결제 및 배송, 고객 문의 대응, 부정 이용 방지.\n3. 보유 기간: 회원 탈퇴 시 즉시 파기 (단, 전자상거래법 등 관계 법령에 따라 보존이 필요한 경우 법정 기간 보관).',
  },
  location: {
    title: '위치기반 서비스 이용약관',
    body: '이용자의 현재 위치를 기반으로 내 주변 이웃 추천, 동네 라이브 방송, 중고거래 직거래 매물 탐색 서비스를 제공합니다.',
  },
}

export default function WebLoginModal() {
  const { isLoginModalOpen, closeLoginModal, emailLogin, emailSignup, socialLogin } = useWebAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [pendingSocialProvider, setPendingSocialProvider] = useState<'kakao' | 'naver' | 'google' | 'apple' | null>(null)
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)

  const [agreements, setAgreements] = useState({
    age14: false,
    tos: false,
    privacy: false,
    location: false,
    marketing: false,
  })

  if (!isLoginModalOpen) return null

  const isAllAgreed =
    agreements.age14 &&
    agreements.tos &&
    agreements.privacy &&
    agreements.location &&
    agreements.marketing

  const isRequiredAgreed = agreements.age14 && agreements.tos && agreements.privacy

  const toggleAll = () => {
    const next = !isAllAgreed
    setAgreements({
      age14: next,
      tos: next,
      privacy: next,
      location: next,
      marketing: next,
    })
  }

  const toggleOne = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const buildConsents = (): ConsentPayload => ({
    termsAgreed: agreements.tos,
    privacyAgreed: agreements.privacy,
    locationAgreed: agreements.location,
    marketingAgreed: agreements.marketing,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast({ title: '입력 확인', description: '이메일과 비밀번호를 입력해 주세요.', variant: 'destructive' })
      return
    }
    if (mode === 'signup') {
      if (!nickname.trim()) {
        toast({ title: '닉네임 필요', description: '사용하실 닉네임을 입력해 주세요.', variant: 'destructive' })
        return
      }
      if (!isRequiredAgreed) {
        toast({
          title: '필수 약관 동의 필요',
          description: '만 14세 이상, 서비스 이용약관, 개인정보 수집·이용에 모두 동의해 주세요.',
          variant: 'destructive',
        })
        return
      }
    }

    setLoading(true)
    try {
      const res =
        mode === 'signup'
          ? await emailSignup(email.trim(), password, nickname.trim(), buildConsents())
          : await emailLogin(email.trim(), password)

      if (!res.success) {
        toast({
          title: mode === 'signup' ? '회원가입 실패' : '로그인 실패',
          description: res.message || '정보를 다시 확인해 주세요.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: mode === 'signup' ? '회원가입 완료' : '로그인 완료',
          description: '모꼬에 오신 것을 환영합니다!',
        })
        setPendingSocialProvider(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialClick = async (provider: 'kakao' | 'naver' | 'google' | 'apple') => {
    if (!isRequiredAgreed) {
      setPendingSocialProvider(provider)
      toast({
        title: '약관 동의 확인',
        description: '최초 가입 및 서비스 이용을 위해 필수 약관에 동의해 주세요.',
      })
      return
    }
    setSocialLoading(provider)
    try {
      const ok = await socialLogin(provider, undefined, buildConsents())
      if (ok) {
        toast({ title: '소셜 로그인 완료', description: '모꼬 서비스에 로그인되었습니다.' })
        setPendingSocialProvider(null)
      } else {
        toast({ title: '로그인 실패', description: '소셜 로그인 중 오류가 발생했습니다.', variant: 'destructive' })
      }
    } finally {
      setSocialLoading(null)
    }
  }

  const renderConsentChecklist = () => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
      <button
        type="button"
        onClick={toggleAll}
        className="w-full flex items-center gap-2.5 text-left font-bold text-xs text-slate-900 pb-2 border-b border-slate-200"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
            isAllAgreed ? 'bg-[#FF3B6B] border-[#FF3B6B] text-white' : 'bg-white border-slate-300'
          }`}
        >
          {isAllAgreed && <Check className="h-3 w-3" />}
        </span>
        <span>모꼬 약관 전체 동의하기</span>
      </button>

      {[
        { key: 'age14' as const, required: true, label: '만 14세 이상입니다' },
        { key: 'tos' as const, required: true, label: '모꼬 서비스 이용약관 동의', detailKey: 'tos' },
        { key: 'privacy' as const, required: true, label: '개인정보 수집 및 이용 동의', detailKey: 'privacy' },
        { key: 'location' as const, required: false, label: '위치기반 서비스 이용약관 동의', detailKey: 'location' },
        { key: 'marketing' as const, required: false, label: '이벤트·혜택 마케팅 정보 수신 동의' },
      ].map((item) => (
        <div key={item.key} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleOne(item.key)}
              className="flex items-center gap-2 text-left text-xs text-slate-700"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                  agreements[item.key]
                    ? 'bg-[#FF3B6B] border-[#FF3B6B] text-white'
                    : 'bg-white border-slate-300'
                }`}
              >
                {agreements[item.key] && <Check className="h-2.5 w-2.5" />}
              </span>
              <span>
                <span className={item.required ? 'font-bold text-[#FF3B6B]' : 'text-slate-400 font-semibold'}>
                  {item.required ? '[필수]' : '[선택]'}
                </span>{' '}
                {item.label}
              </span>
            </button>
            {item.detailKey && (
              <button
                type="button"
                onClick={() => setExpandedTerm((prev) => (prev === item.detailKey ? null : item.detailKey!))}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 shrink-0"
              >
                보기
                {expandedTerm === item.detailKey ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
          {item.detailKey && expandedTerm === item.detailKey && (
            <div className="ml-6 rounded-xl bg-white border border-slate-200 p-2.5 text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
              {TERM_DETAILS[item.detailKey].body}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 space-y-5">
        <button
          type="button"
          onClick={() => {
            setPendingSocialProvider(null)
            closeLoginModal()
          }}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-[#FF3B6B]">
            <Sparkles className="h-3.5 w-3.5" />
            MOCCO
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {pendingSocialProvider
              ? '소셜 간편 가입 약관 동의'
              : mode === 'login'
              ? '모꼬 로그인'
              : '모꼬 회원가입'}
          </h2>
          <p className="text-xs text-slate-500">
            {pendingSocialProvider
              ? '안전한 서비스 이용을 위해 필수 약관에 동의해 주세요.'
              : '동네 라이브, 중고 안전거래, 이웃 수다를 바로 시작하세요.'}
          </p>
        </div>

        {pendingSocialProvider ? (
          <div className="space-y-4">
            {renderConsentChecklist()}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingSocialProvider(null)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                뒤로
              </button>
              <button
                type="button"
                disabled={!isRequiredAgreed || socialLoading !== null}
                onClick={() => handleSocialClick(pendingSocialProvider)}
                className="flex-[2] h-11 rounded-2xl bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] text-xs font-extrabold text-white disabled:opacity-40"
              >
                {socialLoading ? '진행 중...' : '동의하고 계속하기'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  mode === 'signup' ? 'bg-white text-[#FF3B6B] shadow-xs' : 'text-slate-500'
                }`}
              >
                회원가입
              </button>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임 (활동명)"
                    className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF3B6B]/30"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF3B6B]/30"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 (6자 이상)"
                  className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF3B6B]/30"
                />
              </div>

              {mode === 'signup' && renderConsentChecklist()}

              <button
                type="submit"
                disabled={loading || (mode === 'signup' && !isRequiredAgreed)}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#FF3B6B] to-[#8B5CF6] text-xs font-extrabold text-white shadow-md hover:opacity-95 disabled:opacity-45 transition"
              >
                {loading ? '처리 중...' : mode === 'signup' ? '동의하고 회원가입' : '이메일로 로그인'}
              </button>
            </form>

            {/* Social Login Buttons */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>간편 소셜 시작</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSocialClick('kakao')}
                  className="h-10 rounded-xl bg-[#FEE500] text-[#191919] text-xs font-bold hover:brightness-95 transition"
                >
                  카카오로 시작
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialClick('naver')}
                  className="h-10 rounded-xl bg-[#03C75A] text-white text-xs font-bold hover:brightness-95 transition"
                >
                  네이버로 시작
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialClick('google')}
                  className="h-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialClick('apple')}
                  className="h-10 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Apple
                </button>
              </div>
            </div>

            {/* Guest continue */}
            <button
              type="button"
              onClick={closeLoginModal}
              className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              로그인 없이 먼저 둘러보기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
