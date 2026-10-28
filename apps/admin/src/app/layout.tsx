'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Bell,
  CircleDollarSign,
  Clapperboard,
  Code2,
  FileWarning,
  Gift,
  LayoutDashboard,
  MessageCircle,
  Radio,
  Bot,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Users,
  Store,
  Tv,
  Truck,
} from 'lucide-react'
import { AppShell, type AppShellNavItem } from '@/components/layout/app-shell'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { WebAuthProvider } from '@/lib/auth-context'
import { clearAuthStorage } from '@/lib/api'
import './globals.css'

const notoSansKr = {
  className: 'font-sans',
}

const PUBLIC_PATHS = ['/login', '/', '/seller', '/streamer']

const NAV_ITEMS: AppShellNavItem[] = [
  // 1. 본사 총괄 운영
  {
    label: '통합 대시보드',
    href: '/dashboard',
    description: '핵심 운영 현황과 주요 지표',
    group: '본사 총괄 운영',
    icon: LayoutDashboard,
  },
  {
    label: 'AI 운영 본부 & HITL 결재',
    href: '/ai-staff',
    description: '1팀장 + 제브 AI 5인 직원 실시간 결재 센터',
    group: '본사 총괄 운영',
    icon: Bot,
    accent: 'danger',
  },
  {
    label: '마켓 & 에스크로 관리',
    href: '/market-escrow',
    description: '4대 커머스 축(본사·입점사·중고·제휴) 및 에스크로 안전결제·중재',
    group: '본사 총괄 운영',
    icon: ShieldCheck,
  },
  {
    label: '입점사 심사·관리',
    href: '/merchants',
    description: 'B2C 입점 신청 심사, 사업자 서류 검수 및 수수료율 확정',
    group: '본사 총괄 운영',
    icon: Store,
  },
  {
    label: '광고 & 리워드 관리',
    href: '/ads-rewards',
    description: '구좌별 배너 광고 캠페인 및 보상형 리워드 정책 관리',
    group: '본사 총괄 운영',
    icon: Tv,
  },
  {
    label: '라이브 스트리밍',
    href: '/live',
    description: '모꼬 LIVE 실시간 방송 및 시청자·인스트림 커머스 운영',
    group: '본사 총괄 운영',
    icon: Radio,
    accent: 'live',
  },
  {
    label: '1:1 대화 관리',
    href: '/chats',
    description: '채팅방과 대화 안전 운영',
    group: '본사 총괄 운영',
    icon: MessageCircle,
  },
  {
    label: '회원 관리',
    href: '/users',
    description: '회원 검색, 인증 및 상태 관리',
    group: '본사 총괄 운영',
    icon: Users,
  },
  {
    label: '온(ON) 상점',
    href: '/store',
    description: '인앱 온(ON) 충전 상품 및 결제 관리',
    group: '본사 총괄 운영',
    icon: ShoppingBag,
  },
  {
    label: '선물 마스터 관리',
    href: '/store/gifts',
    description: '채팅·라이브 3D 선물 및 이펙트 설정',
    group: '본사 총괄 운영',
    icon: Gift,
  },
  {
    label: '정산 & 환불',
    href: '/settlement',
    description: '온(ON) 정산 및 환불 요청 처리',
    group: '본사 총괄 운영',
    icon: CircleDollarSign,
  },
  {
    label: '게시물 & 공지',
    href: '/content',
    description: '공지사항 및 플랫폼 콘텐츠 관리',
    group: '본사 총괄 운영',
    icon: Clapperboard,
  },
  {
    label: '신고 & 안전',
    href: '/reports-safety',
    description: '사용자 신고 처리 및 제재',
    group: '본사 총괄 운영',
    icon: FileWarning,
    accent: 'danger',
  },
  {
    label: '푸시 알림 센터',
    href: '/notifications',
    description: '전체 및 타깃 푸시 발송 관리',
    group: '본사 총괄 운영',
    icon: Bell,
  },
  {
    label: '지표 분석',
    href: '/analytics',
    description: '서비스 성장 지표 및 코호트 분석',
    group: '본사 총괄 운영',
    icon: BarChart3,
  },
  {
    label: 'API 모니터링',
    href: '/api-manager',
    description: '엔드포인트 상태 및 Rate Limit 모니터링',
    group: '본사 총괄 운영',
    icon: Code2,
  },
  {
    label: '관리자 권한',
    href: '/admin-permissions',
    description: '운영진 계정 및 권한 역할 관리',
    group: '본사 총괄 운영',
    icon: ShieldCheck,
  },
  {
    label: '시스템 설정',
    href: '/settings',
    description: '서비스 글로벌 운영 환경 설정',
    group: '본사 총괄 운영',
    icon: Settings2,
  },

  // 2. 파트너 콘솔 링크(입점사·스트리머)
  {
    label: '🏪 입점사 셀러 센터',
    href: '/seller',
    description: '입점사 상품 관리, 주문 접수, 운송장 발송 및 정산',
    group: '파트너 콘솔 링크(입점사·스트리머)',
    icon: Truck,
  },
  {
    label: '🎙️ 스트리머 스튜디오',
    href: '/streamer',
    description: '제휴 위탁 판매 바구니 관리 & 라이브 커머스 핀 연동',
    group: '파트너 콘솔 링크(입점사·스트리머)',
    icon: Radio,
  },

  // 3. 고객용 웹 바로가기
  {
    label: '🛒 고객 웹 스토어 메인',
    href: '/',
    description: '소비자 PC 반응형 포털 및 3대 마켓 둘러보기',
    group: '고객용 웹 바로가기',
    icon: ShoppingBag,
  },
  {
    label: '🔴 모꼬 LIVE 웹 플레이어',
    href: '/web/live/live-101',
    description: '실시간 방송 시청 & 인스트림 라이브 커머스',
    group: '고객용 웹 바로가기',
    icon: Tv,
  },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [sessionError, setSessionError] = useState(false)
  const [adminName, setAdminName] = useState('관리자')
  const pathname = usePathname()
  const router = useRouter()
  const isPublicPage =
    pathname === '/' ||
    PUBLIC_PATHS.includes(pathname ?? '/') ||
    (pathname != null &&
      (pathname.startsWith('/web') ||
        pathname.startsWith('/share') ||
        pathname.startsWith('/seller') ||
        pathname.startsWith('/streamer')))

  useEffect(() => {
    if (isPublicPage) {
      setSessionError(false)
      setIsAuthenticated(true)
      return
    }
    void (async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          cache: 'no-store',
        })
        const session = await response.json().catch(() => null)
        if (!response.ok) {
          if (response.status === 401) {
            clearAuthStorage()
            setIsAuthenticated(false)
            router.push('/login')
          } else setSessionError(true)
          return
        }
        if (!session?.authenticated || session?.user?.role !== 'admin') {
          clearAuthStorage()
          setIsAuthenticated(false)
          router.push('/login')
          return
        }
        setAdminName(session.user?.name || session.user?.email || '관리자')
        setSessionError(false)
        setIsAuthenticated(true)
      } catch {
        setSessionError(true)
      }
    })()
  }, [isPublicPage, router])

  if (sessionError)
    return (
      <html lang="ko" suppressHydrationWarning>
        <body className={notoSansKr.className}>
          <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="text-base font-semibold">관리자 API에 연결할 수 없습니다.</div>
            <div className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</div>
            <button
              className="rounded-md border px-4 py-2 text-sm"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </button>
          </div>
        </body>
      </html>
    )

  if (isAuthenticated === null)
    return (
      <html lang="ko" suppressHydrationWarning>
        <body className={notoSansKr.className}>
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-sm text-muted-foreground">
              관리자 콘솔을 준비하고 있습니다.
            </div>
          </div>
        </body>
      </html>
    )

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={notoSansKr.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WebAuthProvider>
            {isPublicPage ? (
              children
            ) : (
              <AppShell items={NAV_ITEMS} adminName={adminName}>
                {children}
              </AppShell>
            )}
            <Toaster />
          </WebAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
