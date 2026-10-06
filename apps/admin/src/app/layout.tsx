'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Noto_Sans_KR } from 'next/font/google'
import {
  BarChart3,
  Bell,
  CircleDollarSign,
  Clapperboard,
  Code2,
  Coins,
  FileWarning,
  LayoutDashboard,
  MessageCircle,
  Radio,
  Settings2,
  ShieldCheck,
  Shuffle,
  Users,
} from 'lucide-react'
import { AppShell, type AppShellNavItem } from '@/components/layout/app-shell'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { clearAuthStorage } from '@/lib/api'
import './globals.css'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
const PUBLIC_PATHS = ['/login']

const NAV_ITEMS: AppShellNavItem[] = [
  {
    label: '대시보드',
    href: '/dashboard',
    description: '핵심 운영 현황과 주요 지표',
    group: '대시보드',
    icon: LayoutDashboard,
  },
  {
    label: '회원 관리',
    href: '/users',
    description: '회원 검색, 인증 및 상태 관리',
    group: '회원 관리',
    icon: Users,
  },
  {
    label: '소셜 & 매칭',
    href: '/matches',
    description: '매칭 및 소셜 추천 운영',
    group: '소셜·대화',
    icon: Shuffle,
  },
  {
    label: '1:1 대화 관리',
    href: '/chats',
    description: '채팅방과 대화 안전 운영',
    group: '소셜·대화',
    icon: MessageCircle,
  },
  {
    label: '라이브 스트리밍',
    href: '/live',
    description: '실시간 방송 및 시청자 운영',
    group: '소셜·대화',
    icon: Radio,
    accent: 'live',
  },
  {
    label: '온(ON) 상점',
    href: '/store',
    description: '인앱 온(ON) 판매 상품 관리',
    group: '수익·선물',
    icon: Coins,
  },
  {
    label: '선물 마스터 관리',
    href: '/store/gifts',
    description: '채팅·라이브 3D 선물 및 이펙트 설정',
    group: '수익·선물',
    icon: Coins,
  },
  {
    label: '정산 & 환불',
    href: '/settlement',
    description: '온(ON) 정산 및 환불 요청 처리',
    group: '수익·선물',
    icon: CircleDollarSign,
  },
  {
    label: '광고 & 리워드',
    href: '/ads-rewards',
    description: '보상형 광고 정책 및 자체 배너 운영',
    group: '광고·프로모션',
    icon: CircleDollarSign,
  },
  {
    label: '게시물 & 공지',
    href: '/content',
    description: '공지사항 및 커뮤니티 콘텐츠 관리',
    group: '콘텐츠·안전',
    icon: Clapperboard,
  },
  {
    label: '신고 & 안전',
    href: '/reports-safety',
    description: '사용자 신고 처리 및 제재',
    group: '콘텐츠·안전',
    icon: FileWarning,
    accent: 'danger',
  },
  {
    label: '푸시 알림 센터',
    href: '/notifications',
    description: '전체 및 타깃 푸시 발송 관리',
    group: '운영·설정',
    icon: Bell,
  },
  {
    label: '지표 분석',
    href: '/analytics',
    description: '서비스 성장 지표 및 코호트 분석',
    group: '운영·설정',
    icon: BarChart3,
  },
  {
    label: 'API 모니터링',
    href: '/api-manager',
    description: '엔드포인트 상태 및 Rate Limit 모니터링',
    group: '운영·설정',
    icon: Code2,
  },
  {
    label: '관리자 권한',
    href: '/admin-permissions',
    description: '운영진 계정 및 권한 역할 관리',
    group: '운영·설정',
    icon: ShieldCheck,
  },
  {
    label: '시스템 설정',
    href: '/settings',
    description: '서비스 글로벌 운영 환경 설정',
    group: '운영·설정',
    icon: Settings2,
  },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [sessionError, setSessionError] = useState(false)
  const [adminName, setAdminName] = useState('관리자')
  const pathname = usePathname()
  const router = useRouter()
  const isPublicPage = PUBLIC_PATHS.includes(pathname ?? '/')

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
          {isPublicPage ? (
            children
          ) : (
            <AppShell items={NAV_ITEMS} adminName={adminName}>
              {children}
            </AppShell>
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
