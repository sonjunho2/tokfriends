'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, LogOut, Search } from 'lucide-react'
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
  const activeItem = useMemo(
    () =>
      items.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      ) ?? items[0],
    [items, pathname]
  )
  const groupedItems = useMemo(() => {
    const groups = new Map<string, AppShellNavItem[]>()
    items.forEach((item) => {
      const key = item.group ?? 'Navigation'
      groups.set(key, [...(groups.get(key) ?? []), item])
    })
    return Array.from(groups.entries())
  }, [items])

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex min-h-screen">
        <aside className="hidden border-r bg-background px-4 py-6 md:flex md:w-72 md:flex-col">
          <div className="mb-6 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              DAGAON
            </span>
            <h1 className="text-lg font-semibold">Operations Console</h1>
            <p className="text-xs text-muted-foreground">
              Premium social service administration
            </p>
          </div>
          <div className="mb-5">
            <label className="sr-only" htmlFor="global-search">
              관리자 메뉴 검색
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="global-search"
                placeholder="메뉴 검색"
                className="pl-8 text-sm"
                autoComplete="off"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              통합 검색은 추후 제공될 예정입니다.
            </p>
          </div>
          <nav className="flex-1 space-y-4" aria-label="Admin navigation">
            {groupedItems.map(([group, groupItems]) => (
              <div key={group} className="space-y-1">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                {groupItems.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
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
          <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-8">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  DAGAON Admin
                </p>
                <h2 className="truncate text-base font-semibold">
                  {activeItem?.label ?? 'Dashboard'}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {activeItem?.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border px-3 py-1 text-xs md:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">{adminName}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/settings')}
                >
                  Settings
                </Button>
                <Button variant="secondary" size="sm" onClick={logoutToLogin}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
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
