'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, LogOut, Search, Smartphone, ShoppingBag, Crown, Truck, Radio } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logoutToLogin } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface AppShellNavItem {
  label: string
  href: string
  description: string
  badge?: string
  group?: string
  icon?: LucideIcon
  accent?: 'live' | 'danger'
}

interface AppShellProps {
  items: AppShellNavItem[]
  adminName?: string
  children: React.ReactNode
}

export function AppShell({ items, adminName = '관리자', children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuQuery, setMenuQuery] = useState('')
  const checkIsActive = (itemHref: string) => {
    if (pathname === itemHref) return true
    if (pathname.startsWith(`${itemHref}/`)) {
      const hasMoreSpecificMatch = items.some(
        (other) =>
          other.href !== itemHref &&
          other.href.startsWith(`${itemHref}/`) &&
          (pathname === other.href || pathname.startsWith(`${other.href}/`))
      )
      return !hasMoreSpecificMatch
    }
    return false
  }

  const activeItem = useMemo(
    () => items.find((item) => checkIsActive(item.href)) ?? items[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, pathname]
  )
  const groupedItems = useMemo(() => {
    const q = menuQuery.trim().toLowerCase()
    const filtered = q
      ? items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            (item.group ?? '').toLowerCase().includes(q)
        )
      : items
    const groups = new Map<string, AppShellNavItem[]>()
    filtered.forEach((item) => {
      const key = item.group ?? '메뉴'
      groups.set(key, [...(groups.get(key) ?? []), item])
    })
    return Array.from(groups.entries())
  }, [items, menuQuery])

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex min-h-screen">
        <aside className="hidden border-r bg-background px-4 py-5 md:flex md:w-64 md:flex-col">
          <div className="mb-5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              MOCCO
            </span>
            <h1 className="text-base font-bold text-foreground">통합 관리자</h1>
          </div>
          <div className="mb-4">
            <label className="sr-only" htmlFor="global-search">
              관리자 메뉴 검색
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="global-search"
                value={menuQuery}
                onChange={(e) => setMenuQuery(e.target.value)}
                placeholder="메뉴 검색"
                className="h-8 pl-8 text-xs"
                autoComplete="off"
              />
            </div>
          </div>
          <nav className="flex-1 space-y-4" aria-label="Admin navigation">
            {groupedItems.map(([group, groupItems]) => (
              <div key={group} className="space-y-1">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                {groupItems.map((item) => {
                  const isActive = checkIsActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors',
                        isActive
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'hover:bg-muted/70'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            item.accent === 'live' && 'text-[#FF3B6B]',
                            item.accent === 'danger' && 'text-[#E5484D]'
                          )}
                          aria-hidden
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-8">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-foreground">
                  {activeItem?.label ?? '통합 대시보드'}
                </h2>
                {activeItem?.description ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {activeItem.description}
                  </p>
                ) : null}
              </div>

              {/* 3-Tier Admin Switcher + Actions */}
              <div className="flex items-center flex-wrap gap-2">
                <div className="hidden lg:flex items-center rounded-lg border bg-muted/40 p-1 text-xs">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold text-primary bg-background shadow-xs transition-colors"
                  >
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    <span>본사 총괄</span>
                  </Link>
                  <Link
                    href="/seller"
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Truck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>입점사 셀러</span>
                  </Link>
                  <Link
                    href="/streamer"
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Radio className="h-3.5 w-3.5 text-rose-500" />
                    <span>스트리머 스튜디오</span>
                  </Link>
                </div>

                <div className="hidden items-center gap-2 rounded-full border px-3 py-1 text-xs md:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">{adminName}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 font-medium"
                  asChild
                >
                  <Link href="/">
                    <ShoppingBag className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">고객 웹</span>
                    <span className="sm:hidden">고객 웹</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/settings')}
                >
                  설정
                </Button>
                <Button variant="secondary" size="sm" onClick={logoutToLogin}>
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  로그아웃
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default AppShell
