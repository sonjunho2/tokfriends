/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Radio,
  Smartphone,
  Download,
  ExternalLink,
  Users,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ShareLiveLandingPage() {
  const params = useParams()
  const router = useRouter()
  const liveId = (params?.id as string) || 'live-101'

  const [isMobile, setIsMobile] = useState(false)

  // Mock live info
  const live = {
    id: liveId,
    title: '[산지직송] 제주도 특급 흑돼지 & 한라봉 실시간 특별 할인전',
    hostName: '제주푸드 본사 직영',
    viewers: 1420,
    thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
  }

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    const mobileCheck = /iphone|ipad|ipod|android/i.test(ua)
    setIsMobile(mobileCheck)

    if (mobileCheck) {
      // Try native app deep link
      window.location.href = `mocco://live/${liveId}`
    } else {
      // PC Browser: direct to customer live web viewer
      const timer = setTimeout(() => {
        router.push(`/web/live/${liveId}`)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [liveId, router])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[#FF3B6B] flex items-center justify-center text-white shadow-md">
            <Radio className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">MOCCO LIVE</span>
          <Badge className="bg-[#FF3B6B]/20 text-[#FF3B6B] border border-[#FF3B6B]/30 text-[10px] font-bold">
            ON AIR
          </Badge>
        </div>

        {/* Live Preview Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60 text-left">
          <div className="aspect-video w-full overflow-hidden relative">
            <img src={live.thumbnail} alt={live.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#FF3B6B] flex items-center justify-center text-white shadow-lg">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 text-[11px] font-mono font-bold text-white">
              <Users className="w-3.5 h-3.5 text-[#FF3B6B]" />
              {live.viewers.toLocaleString()}명
            </div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs text-[#FF3B6B] font-semibold">{live.hostName}</div>
            <h3 className="font-bold text-sm text-white line-clamp-2">{live.title}</h3>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <Button asChild className="w-full bg-[#FF3B6B] hover:bg-[#E02956] text-white font-bold h-11 text-sm rounded-xl gap-2 shadow-sm transition-colors">
            <a href={`mocco://live/${liveId}`}>
              <Smartphone className="w-4 h-4" />
              모꼬 앱으로 방송 시청
            </a>
          </Button>

          <Button asChild variant="outline" className="w-full border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 h-11 text-sm rounded-xl gap-2 transition-colors">
            <Link href={`/web/live/${liveId}`}>
              <ExternalLink className="w-4 h-4" />
              PC 웹 플레이어로 바로 시청
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
