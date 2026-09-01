'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Noto_Sans_KR } from 'next/font/google'

import { AppShell, type AppShellNavItem } from '@/components/layout/app-shell'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { getAccessToken } from '@/lib/api'

import './globals.css'

import {
  LayoutDashboard,
  Users,
  Shuffle,
  MessageCircle,
  Megaphone,
  BarChart3,
  Settings2,
  Store,
} from 'lucide-react'

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
    description: '오늘 서비스 상황과 우선 처리할 일을 한눈에 확인합니다.',
    group: '핵심 모니터링',
    icon: LayoutDashboard,
  },
  {
    label: '분석 & 리포트',
    href: '/analytics',
    description: '핵심 지표와 정기 보고서를 확인하고 공유합니다.',
    group: '핵심 모니터링',
    icon: BarChart3,
  },
  {
    label: '사용자',
    href: '/users',
    description: '가입·인증·문의 이력을 찾아보고 바로 대응합니다.',
    group: '이용자 운영',
    icon: Users,
  },
  {
    label: '매칭 & 탐색',
    href: '/matches',
    description: '매칭 대기열과 추천 기준을 조정해 이용자 경험을 개선합니다.',
    badge: 'Beta',
    group: '이용자 운영',
    icon: Shuffle,
  },
  {
    label: '채팅 & 안전',
    href: '/chats',
    description: '실시간 채팅방 상태와 신고 접수를 모니터링합니다.',
    group: '이용자 운영',
    icon: MessageCircle,
  },
  {
    label: '콘텐츠 & 참여',
    href: '/content',
    description: '공지와 캠페인을 작성하고 발행 일정을 관리합니다.',
    group: '성장 & 참여',
    icon: Megaphone,
  },
  {
    label: '상점',
    href: '/store',
    description: '포인트 상품과 결제 관련 항목을 손쉽게 설정합니다.',
    group: '성장 & 참여',
    icon: Store,
  },
  {
    label: '설정',
    href: '/settings',
    description: '팀 권한, 기능 플래그, 외부 연동 정보를 관리합니다.',
    group: '운영 지원',
    icon: Settings2,
  },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const token = getAccessToken()
    const currentPath = pathname ?? '/'

    if (PUBLIC_PATHS.includes(currentPath)) {
      setIsAuthenticated(true)
      return
    }

    if (token) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
      router.push('/login')
    }
  }, [pathname, router])

  if (isAuthenticated === null) {
    return (
      <html lang="ko" suppressHydrationWarning>
        <body className={notoSansKr.className}>
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-sm text-muted-foreground">콘솔을 준비하고 있습니다…</div>
          </div>
        </body>
      </html>
    )
  }

  const currentPath = pathname ?? '/'
  const isPublicPage = PUBLIC_PATHS.includes(currentPath)

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={notoSansKr.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {isPublicPage ? children : <AppShell items={NAV_ITEMS}>{children}</AppShell>}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
