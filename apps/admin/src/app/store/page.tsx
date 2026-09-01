'use client'

import Link from 'next/link'
import { ShoppingBag, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StoreOverviewPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">상점 운영</h1>
        <p className="text-sm text-muted-foreground">
          포인트 상품, 구독, 앱스토어 연동 정보를 관리해 신규 결제 플로우를 안정적으로 운영하세요.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" /> 포인트 상품 관리
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                앱 내 포인트 판매 상품의 노출 순서, 가격, 추천 여부를 관리합니다.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/store/point-products">포인트 상품 편집</Link>
            </Button>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            앱스토어/플레이스토어 상품 ID와 실제 가격이 일치하는지 확인하고, 추천 상품을 지정해 결제 전환을 높일 수 있습니다.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> 앞으로 추가될 항목
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            구독 상품, 번들 프로모션, 결제 실패 모니터링 등 상점 관련 모듈을 순차적으로 확장할 예정입니다.
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
