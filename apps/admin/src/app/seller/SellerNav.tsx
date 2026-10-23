'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Truck, CircleDollarSign, Store, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function SellerNav() {
  const pathname = usePathname()

  const tabs = [
    { label: '셀러 대시보드', href: '/seller', icon: LayoutDashboard },
    { label: '상품 등록 & 관리', href: '/seller/products', icon: Package },
    { label: '주문 & 배송 관리', href: '/seller/orders', icon: Truck },
    { label: '정산 내역 조회', href: '/seller/settlements', icon: CircleDollarSign },
  ]

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">제주푸드 본사 직영</h1>
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs">
                공식 입점사 승인 (수수료율 9.5%)
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              사업자등록번호: 616-81-99201 | 대표자: 고성훈 | 통신판매업: 2025-제주오라-0112
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/market-escrow"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            관리자 마켓&에스크로 복귀
          </Link>
        </div>
      </div>

      <nav className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Seller Portal Navigation">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
