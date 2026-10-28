'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Truck, CircleDollarSign, Store, ArrowLeft, ShoppingBag, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWebAuth } from '@/lib/auth-context'

export function SellerNav() {
  const pathname = usePathname()
  const { user, role, openMerchantModal } = useWebAuth()

  const tabs = [
    { label: '셀러 대시보드', href: '/seller', icon: LayoutDashboard },
    { label: '상품 등록 & 관리', href: '/seller/products', icon: Package },
    { label: '주문 & 배송 관리', href: '/seller/orders', icon: Truck },
    { label: '정산 내역 조회', href: '/seller/settlements', icon: CircleDollarSign },
  ]

  const isAuthorized = role === 'MERCHANT' || role === 'ADMIN'

  const businessName = user?.merchantInfo?.businessName || user?.nickname || '공식 입점사'
  const businessNumber = user?.merchantInfo?.businessNumber || '616-81-99201'
  const representative = user?.merchantInfo?.representative || '대표자'

  return (
    <div className="space-y-4 mb-6">
      {!isAuthorized && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">입점사(Seller) 전용 관리 페이지입니다.</p>
              <p className="text-[11px] text-amber-700">현재 일반 회원 권한입니다. 입점 신청을 완료하면 정식 셀러 권한이 부여됩니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={openMerchantModal}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8"
            >
              🏪 지금 입점 신청하기
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs h-8 bg-white">
              <Link href="/">홈으로 가기</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{businessName}</h1>
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">
                공식 입점사 셀러 센터 (수수료율 9.5%)
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              사업자등록번호: {businessNumber} | 대표자: {representative} | 에스크로 정산 안전 보증
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            🛒 고객 웹 스토어
          </Link>
          {role === 'ADMIN' && (
            <Link
              href="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              👑 본사 총괄 관리자
            </Link>
          )}
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
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
