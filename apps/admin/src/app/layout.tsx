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
  Crown,
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

// 관리자 전용 보호 경로 (오직 이 경로들만 관리자 세션 체크 및 /login 리다이렉트 대상)
const ADMIN_PROTECTED_PATHS = [
  '/dashboard',
  '/admin-permissions',
  '/analytics',
  '/api-manager',
  '/content',
  '/reports-safety',
  '/market-escrow',
  '/merchants',
  '/notifications',
  '/settings',
  '/settlement',
  '/store',
  '/users',
  '/live',
  '/chats',
  '/ads-rewards',
  '/ai-staff',
]

const NAV_ITEMS: AppShellNavItem[] = [
  // 1. 운영 현황
  {
    label: '통합 대시보드',
    href: '/dashboard',
    description: '핵심 운영 지표',
    group: '운영 현황',
    icon: LayoutDashboard,
  },
  {
    label: '지표 분석',
    href: '/analytics',
    description: '서비스 성장·코호트 분석',
    group: '운영 현황',
    icon: BarChart3,
  },

  // 2. 커머스 & 정산
  {
    label: '본사 직영 상품',
    href: '/dashboard/products',
    description: '직영 상품 등록 및 재고 관리',
    group: '커머스 & 정산',
    icon: Crown,
  },
  {
    label: '마켓 & 에스크로',
    href: '/market-escrow',
    description: '상품 검수 및 안전결제 관리',
    group: '커머스 & 정산',
    icon: ShieldCheck,
  },
  {
    label: '입점사 관리',
    href: '/merchants',
    description: '입점 심사 및 수수료 관리',
    group: '커머스 & 정산',
    icon: Store,
  },
  {
    label: '정산 & 환불',
    href: '/settlement',
    description: '정산 내역 및 환불 처리',
    group: '커머스 & 정산',
    icon: CircleDollarSign,
  },
  {
    label: '꿀떡 상점',
    href: '/store',
    description: '충전 상품 및 결제 관리',
    group: '커머스 & 정산',
    icon: ShoppingBag,
  },
  {
    label: '선물 마스터',
    href: '/store/gifts',
    description: '선물 아이템 및 단가 설정',
    group: '커머스 & 정산',
    icon: Gift,
  },

  // 3. 회원 & 안전
  {
    label: '회원 관리',
    href: '/users',
    description: '회원 조회 및 상태 관리',
    group: '회원 & 안전',
    icon: Users,
  },
  {
    label: '라이브 스트리밍',
    href: '/live',
    description: '실시간 방송 모니터링',
    group: '회원 & 안전',
    icon: Radio,
    accent: 'live',
  },
  {
    label: '1:1 대화 관리',
    href: '/chats',
    description: '채팅방 및 메시지 모니터링',
    group: '회원 & 안전',
    icon: MessageCircle,
  },
  {
    label: '신고 & 안전',
    href: '/reports-safety',
    description: '신고 접수 및 제재 처리',
    group: '회원 & 안전',
    icon: FileWarning,
    accent: 'danger',
  },
  {
    label: 'AI 운영 본부',
    href: '/ai-staff',
    description: '자동 심사 및 결재 현황',
    group: '회원 & 안전',
    icon: Bot,
    accent: 'danger',
  },

  // 4. 서비스 & 설정
  {
    label: '공지 & 고객센터',
    href: '/content',
    description: '공지, FAQ 및 1:1 문의',
    group: '서비스 & 설정',
    icon: Clapperboard,
  },
  {
    label: '광고 & 리워드',
    href: '/ads-rewards',
    description: '배너 광고 및 리워드 설정',
    group: '서비스 & 설정',
    icon: Tv,
  },
  {
    label: '푸시 알림',
    href: '/notifications',
    description: '전체·타깃 푸시 발송',
    group: '서비스 & 설정',
    icon: Bell,
  },
  {
    label: '관리자 권한',
    href: '/admin-permissions',
    description: '운영진 계정 및 권한 관리',
    group: '서비스 & 설정',
    icon: ShieldCheck,
  },
  {
    label: 'API 모니터링',
    href: '/api-manager',
    description: '엔드포인트 상태 및 로그',
    group: '서비스 & 설정',
    icon: Code2,
  },
  {
    label: '시스템 설정',
    href: '/settings',
    description: '서비스 환경 설정',
    group: '서비스 & 설정',
    icon: Settings2,
  },

  // 5. 외부 콘솔
  {
    label: '입점사 셀러 센터',
    href: '/seller',
    description: '입점사 전용 콘솔',
    group: '외부 콘솔',
    icon: Truck,
  },
  {
    label: '스트리머 스튜디오',
    href: '/streamer',
    description: '크리에이터 제휴 콘솔',
    group: '외부 콘솔',
    icon: Radio,
  },
  {
    label: '고객 웹 메인',
    href: '/',
    description: '소비자 웹 포털',
    group: '외부 콘솔',
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

  // i18n 언어 prefix(/ko, /en) 및 trailing slash를 정규화
  const cleanPath = (pathname || '/')
    .replace(/^\/(ko|en)(\/|$)/, '/')
    .replace(/\/+$/, '') || '/'

  // 오직 ADMIN_PROTECTED_PATHS에 포함된 페이지만 관리자 인증을 요구함
  const isAdminPage = ADMIN_PROTECTED_PATHS.some(
    (p) => cleanPath === p || cleanPath.startsWith(p + '/')
  )
  const isPublicPage = !isAdminPage

  useEffect(() => {
    // 공개 페이지(홈페이지, 셀러, 크리에이터, 로그인, 고객웹 등)는 즉시 인증 통과
    if (isPublicPage) {
      setSessionError(false)
      setIsAuthenticated(true)
      return
    }

    // 관리자 전용 페이지(/dashboard 등) 접근 시에만 관리자 세션 검증
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

  // 관리자 페이지에서 에러가 발생한 경우만 에러 화면 노출
  if (sessionError && isAdminPage)
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

  // 관리자 페이지 접근 시에만 준비 로딩 노출 (공개 페이지는 즉시 children 렌더)
  if (isAuthenticated === null && isAdminPage)
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
