/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Smartphone,
  Download,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ShareMarketLandingPage() {
  const params = useParams()
  const router = useRouter()
  const productId = (params?.id as string) || 'np-001'

  const [isMobile, setIsMobile] = useState(false)
  const [appLaunched, setAppLaunched] = useState(false)

  // Mock product info for fallback display
  const product = {
    id: productId,
    title: '[입점사상시] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg',
    price: 32900,
    originalPrice: 38000,
    merchantName: '제주푸드 본사 직영',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
  }

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    const mobileCheck = /iphone|ipad|ipod|android/i.test(ua)
    setIsMobile(mobileCheck)

    if (mobileCheck) {
      // 1. Try launching native app deep link
      const deepLinkUrl = `dagaon://market/${productId}`
      window.location.href = deepLinkUrl
      setAppLaunched(true)
    } else {
      // 2. PC Browser: direct to customer web portal
      const timer = setTimeout(() => {
        router.push(`/portal?productId=${productId}`)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [productId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur text-center space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">DAGAON</span>
        </div>

        {/* Product Preview Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/50 text-left">
          <div className="aspect-video w-full overflow-hidden relative">
            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
            <Badge className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold">
              브랜드 공식 입점사
            </Badge>
          </div>
          <div className="p-4 space-y-1.5">
            <div className="text-xs text-slate-400">{product.merchantName}</div>
            <h3 className="font-bold text-sm text-white line-clamp-2">{product.title}</h3>
            <div className="text-lg font-black font-mono text-rose-400 pt-1">
              {product.price.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* Guidance and Deep Link Actions */}
        <div className="space-y-2.5">
          <Button asChild className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold h-11 text-sm rounded-xl gap-2 shadow-lg">
            <a href={`dagaon://market/${productId}`}>
              <Smartphone className="w-4 h-4" />
              모꼬 앱으로 상품 보기
            </a>
          </Button>

          <Button asChild variant="outline" className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 h-11 text-sm rounded-xl gap-2">
            <Link href={`/portal?productId=${productId}`}>
              <ExternalLink className="w-4 h-4" />
              PC 웹 스토어에서 바로보기
            </Link>
          </Button>

          <Button asChild variant="ghost" className="w-full text-slate-400 hover:text-white text-xs h-9 gap-1.5">
            <a href="/downloads/mocco-release.apk" download="mocco-release.apk">
              <Download className="w-3.5 h-3.5" />
              최신 모꼬 안드로이드 APK 다운로드
            </a>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          토스페이먼츠 에스크로 100% 안전거래 보장
        </div>
      </div>
    </div>
  )
}
