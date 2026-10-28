'use client'

import React, { useState } from 'react'
import { FlaskConical, X, Check, ShieldCheck, Store, Mic, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useWebAuth, type UserRole } from '@/lib/auth-context'

/**
 * 🧪 시연 및 기능 검수용 플로팅 역할 전환 위젯
 * 헤더나 메인 UI를 전혀 침범하지 않고 화면 우측 하단에 플로팅으로 띄워집니다.
 * 실제 서비스 운영 시 이 컴포넌트 사용부만 한 줄 삭제하면 깔끔하게 제거됩니다.
 */
export function RoleSwitcherFloating() {
  const { role, switchRole } = useWebAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const roles: { key: UserRole; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      key: 'GUEST',
      label: '게스트 (비로그인)',
      desc: '둘러보기 가능, 서비스 이용 시 로그인 유도',
      icon: <User className="h-4 w-4" />,
      color: 'border-slate-300 text-slate-700 hover:bg-slate-50',
    },
    {
      key: 'USER',
      label: '일반 회원',
      desc: '중고거래 글쓰기, 소통 라이브 개설, 마켓 구매',
      icon: <User className="h-4 w-4" />,
      color: 'border-blue-300 text-blue-700 hover:bg-blue-50',
    },
    {
      key: 'MERCHANT',
      label: '입점사 (셀러)',
      desc: '[🏪 셀러 센터] 활성화 (상품/주문/배송/정산)',
      icon: <Store className="h-4 w-4" />,
      color: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
    },
    {
      key: 'CREATOR',
      label: '공식 크리에이터',
      desc: '[🎙️ 스튜디오] 활성화 (라이브커머스 핀 상품/커미션)',
      icon: <Mic className="h-4 w-4" />,
      color: 'border-purple-300 text-purple-700 hover:bg-purple-50',
    },
    {
      key: 'ADMIN',
      label: '회사 총괄 운영진',
      desc: '[👑 총괄 관리자 콘솔] 활성화 (/dashboard)',
      icon: <ShieldCheck className="h-4 w-4" />,
      color: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    },
  ]

  const handleSelectRole = (targetRole: UserRole, label: string) => {
    switchRole(targetRole)
    setIsOpen(false)
    toast({
      title: `✅ [${label}] 권한 전환 완료`,
      description: '상단 네비게이션과 권한별 관리자 버튼이 즉시 갱신되었습니다.',
    })
  }

  const currentRoleInfo = roles.find((r) => r.key === role) || roles[0]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4 text-pink-600" />
              <span className="text-xs font-extrabold text-slate-900">시연용 역할 스위처</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-tight">
            원하는 역할을 클릭하면 즉시 해당 권한으로 전환되어 전용 관리자 및 기능을 테스트할 수 있습니다.
          </p>

          <div className="space-y-1.5">
            {roles.map((r) => {
              const isSelected = r.key === role
              return (
                <button
                  key={r.key}
                  onClick={() => handleSelectRole(r.key, r.label)}
                  className={`w-full flex items-center justify-between rounded-xl border p-2 text-left transition-all ${
                    isSelected ? 'border-pink-500 bg-pink-50/70 shadow-xs' : r.color
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">{r.icon}</span>
                    <div>
                      <div className="text-xs font-bold leading-tight flex items-center gap-1">
                        {r.label}
                        {isSelected && <span className="text-[10px] text-pink-600 font-extrabold">(현재)</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{r.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-pink-600 shrink-0" />}
                </button>
              )
            })}
          </div>

          <div className="pt-1 text-center">
            <span className="text-[10px] text-slate-400">
              ※ 이 위젯은 실제 서비스 오픈 시 제거할 수 있는 테스트 도구입니다.
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-pink-200 bg-white/95 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xl backdrop-blur-md hover:bg-pink-50 hover:border-pink-300 hover:scale-105 transition-all"
        >
          <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-ping" />
          <FlaskConical className="h-3.5 w-3.5 text-pink-600" />
          <span>역할전환:</span>
          <span className="text-pink-600 font-extrabold">{currentRoleInfo.label.split(' ')[0]}</span>
        </button>
      )}
    </div>
  )
}

