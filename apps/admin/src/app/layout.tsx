'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Noto_Sans_KR } from 'next/font/google'
import {
  BarChart3,
  CircleDollarSign,
  Clapperboard,
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
    label: 'Dashboard',
    href: '/dashboard',
    description: '핵심 운영 현황과 주요 지표',
    group: 'Overview',
    icon: LayoutDashboard,
  },
  {
    label: 'Members',
    href: '/users',
    description: '회원 검색, 인증 및 상태 관리',
    group: 'Community',
    icon: Users,
  },
  {
    label: 'Social',
    href: '/matches',
    description: '매칭 및 소셜 추천 운영',
    group: 'Community',
    icon: Shuffle,
  },
  {
    label: 'Chat',
    href: '/chats',
    description: '채팅방과 대화 안전 운영',
    group: 'Community',
    icon: MessageCircle,
  },
  {
    label: 'Live',
    href: '/live',
    description: '라이브 운영 기반',
    group: 'Community',
    icon: Radio,
    accent: 'live',
  },
  {
    label: 'Content',
    href: '/content',
    description: '공지와 운영 콘텐츠 관리',
    group: 'Growth',
    icon: Clapperboard,
  },
  {
    label: 'Points & Gifts',
    href: '/store',
    description: '포인트 상품과 기프트 운영',
    group: 'Growth',
    icon: Coins,
  },
  {
    label: 'Ads & Rewards',
    href: '/ads-rewards',
    description: '광고 및 리워드 운영 기반',
    group: 'Growth',
    icon: CircleDollarSign,
  },
  {
    label: 'Settlement',
    href: '/settlement',
    description: '정산 운영 기반',
    group: 'Operations',
    icon: CircleDollarSign,
  },
  {
    label: 'Reports & Safety',
    href: '/reports-safety',
    description: '신고 및 안전 운영 기반',
    group: 'Operations',
    icon: FileWarning,
    accent: 'danger',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    description: '서비스 지표와 정기 리포트',
    group: 'Operations',
    icon: BarChart3,
  },
  {
    label: 'Admin & Permissions',
    href: '/admin-permissions',
    description: '관리자와 권한 운영 기반',
    group: 'System',
    icon: ShieldCheck,
  },
  {
    label: 'Settings',
    href: '/settings',
    description: '서비스 및 운영 환경 설정',
    group: 'System',
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
