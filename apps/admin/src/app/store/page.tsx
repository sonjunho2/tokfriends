'use client'

import Link from 'next/link'
import { Coins, Gift, ShoppingBag, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StoreOverviewPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">수익 및 상점 운영</h1>
        <p className="text-sm text-muted-foreground">
          앱 내 온(ON) 판매 상품, 채팅·라이브 3D 선물 마스터 및 결제 인프라를 안정적으로 운영합니다.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" /> 온(ON) 상품 관리
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                앱 내 온(ON) 판매 상품의 노출 순서, 가격, 추천 여부를 관리합니다.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/store/point-products">온(ON) 상품 편집</Link>
            </Button>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            인앱 결제(Google Play / App Store) 상품 ID와 실제 가격이 일치하는지 확인하고, 추천 상품을 지정해 결제 전환을 높일 수 있습니다.
          </CardContent>
        </Card>

        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" /> 선물 마스터 관리 (3D 이펙트)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                채팅 및 라이브 방송에서 사용할 선물 아이템, 가격, 3D 알파 비디오를 관리합니다.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/store/gifts">선물 마스터 설정</Link>
            </Button>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            선물별 온(ON) 가격, 썸네일, 3D 투명 알파 비디오(Alpha MP4) URL, 카테고리(일반/스페셜/VIP) 및 노출 채널(채팅/라이브)을 실시간으로 설정합니다.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-emerald-500" /> 정산 및 환불 센터
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                사용자 지갑 잔액 현황, 온(ON) 구매 내역 및 환불 요청을 심사합니다.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/settlement">정산 현황 보기</Link>
            </Button>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            총 온(ON) 유통량, 충전액, 미처리 환불 요청 및 지갑 원장(WalletLedger)을 투명하게 확인합니다.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> 향후 확장 예정
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            VIP 정기 구독 상품, 첫 충전 2배 프로모션 번들, 결제 이상 징후 자동 탐지 기능이 순차적으로 확장될 예정입니다.
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
