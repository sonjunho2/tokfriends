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
      window.location.href = `dagaon://live/${liveId}`
    } else {
      // PC Browser: direct to customer live web viewer
      const timer = setTimeout(() => {
        router.push(`/web/live/${liveId}`)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [liveId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur text-center space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg animate-pulse">
            <Radio className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">D LIVE</span>
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] font-bold">
            실시간 방송 중
          </Badge>
        </div>

        {/* Live Preview Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/50 text-left">
          <div className="aspect-video w-full overflow-hidden relative">
            <img src={live.thumbnail} alt={live.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/90 flex items-center justify-center text-white shadow-xl">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-[11px] font-mono font-bold">
              <Users className="w-3 h-3 text-rose-400" />
              {live.viewers.toLocaleString()}명
            </div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs text-rose-400 font-semibold">{live.hostName}</div>
            <h3 className="font-bold text-sm text-white line-clamp-2">{live.title}</h3>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <Button asChild className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold h-11 text-sm rounded-xl gap-2 shadow-lg">
            <a href={`dagaon://live/${liveId}`}>
              <Smartphone className="w-4 h-4" />
              다가온 앱으로 방송 시청
            </a>
          </Button>

          <Button asChild variant="outline" className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 h-11 text-sm rounded-xl gap-2">
            <Link href={`/web/live/${liveId}`}>
              <ExternalLink className="w-4 h-4" />
              PC 웹 플레이어로 바로 시청
            </Link>
          </Button>

          <Button asChild variant="ghost" className="w-full text-slate-400 hover:text-white text-xs h-9 gap-1.5">
            <a href="/downloads/dagaon-release.apk" download="dagaon-release.apk">
              <Download className="w-3.5 h-3.5" />
              최신 다가온 안드로이드 APK 다운로드
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
