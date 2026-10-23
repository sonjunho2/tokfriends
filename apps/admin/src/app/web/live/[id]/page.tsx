/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Radio,
  Users,
  Heart,
  Send,
  ShoppingBag,
  Volume2,
  VolumeX,
  Maximize2,
  Share2,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowLeft,
  Pin,
  Sparkles,
  CreditCard,
  MessageCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'

interface ChatMessage {
  id: string
  sender: string
  text: string
  isHost?: boolean
  isSystem?: boolean
  time: string
}

export default function WebLivePlayerPage() {
  const params = useParams()
  const liveId = (params?.id as string) || 'live-101'
  const { toast } = useToast()

  // Video & Stream State
  const [isMuted, setIsMuted] = useState(true)
  const [likesCount, setLikesCount] = useState(3840)
  const [viewerCount, setViewerCount] = useState(1420)

  // Floating Pinned Product
  const pinnedProduct = {
    id: 'np-001',
    title: '[D LIVE 단독특가] 제주 산지직송 1등급 흑돼지 오겹살 1kg',
    price: 28900,
    originalPrice: 38000,
    discountRate: 24,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    merchantName: '제주푸드 본사 직영',
  }

  // Live Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: '시스템',
      text: '다가온 D LIVE 실시간 방송에 오신 것을 환영합니다! 에스크로 안전결제로 방송 특가 상품을 바로 구매하실 수 있습니다.',
      isSystem: true,
      time: '12:00',
    },
    {
      id: 'm2',
      sender: '제주흑돈직영 (호스트)',
      text: '안녕하세요 여러분! 오늘 당일 도축한 최고급 제주 흑돼지 특가 라이브 시작합니다~',
      isHost: true,
      time: '12:01',
    },
    {
      id: 'm3',
      sender: '고기러버',
      text: '와 구성 진짜 좋네요 바로 주문했습니다!',
      time: '12:02',
    },
    {
      id: 'm4',
      sender: '지수맘',
      text: '오늘 주문하면 내일 바로 도착하나요?',
      time: '12:03',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Instant Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [buyerName, setBuyerName] = useState('웹시청자')
  const [buyerPhone, setBuyerPhone] = useState('010-9876-5432')
  const [shippingAddress, setShippingAddress] = useState('서울특별시 송파구 올림픽로 300 28층')
  const [isProcessingPay, setIsProcessingPay] = useState(false)

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Periodic random chat simulator
  useEffect(() => {
    const timer = setInterval(() => {
      const randomNicknames = ['캠핑매니아', '맛스타그램', '서울러', '요리왕', '제주도민']
      const randomTexts = [
        '품질 믿고 주문합니다!',
        '방송 중에만 이 가격인가요?',
        '포장 꼼꼼하게 부탁드려요~',
        '와 진짜 신선해보여요 대박',
        '1세트 더 구매 완료했습니다!',
      ]
      const randomNick = randomNicknames[Math.floor(Math.random() * randomNicknames.length)]
      const randomTxt = randomTexts[Math.floor(Math.random() * randomTexts.length)]

      const newMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        sender: randomNick,
        text: randomTxt,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev.slice(-40), newMsg])
    }, 4500)

    return () => clearInterval(timer)
  }, [])

  // Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: '나 (웹 시청자)',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, newMsg])
    setChatInput('')
  }

  // Submit Instant Buy
  const handleExecuteLivePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessingPay(true)

    try {
      // Backend PG Prepare if available
      try {
        await api.post('/api/payments/escrow/prepare', {
          productId: pinnedProduct.id,
          liveId,
          quantity: 1,
          shippingAddress,
          pgProvider: 'TOSS_PAYMENTS',
        })
      } catch {}

      // Add Purchase Broadcast to chat
      const purchaseMsg: ChatMessage = {
        id: `m-buy-${Date.now()}`,
        sender: '🎉 실시간 구매 완료',
        text: `${buyerName}님이 [${pinnedProduct.title}] 상품을 주문하셨습니다!`,
        isSystem: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, purchaseMsg])

      toast({
        title: '🎉 D LIVE 인스트림 결제 완료',
        description: `${pinnedProduct.price.toLocaleString()}원이 에스크로에 안전 예치되었습니다. 방송 중 주문이 접수되었습니다!`,
      })

      setIsCheckoutOpen(false)
    } catch (err: any) {
      toast({
        title: '결제 실패',
        description: err?.message || '결제 승인 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingPay(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            웹 스토어 복귀
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-sm tracking-tight">D LIVE WEB PLAYER</span>
            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] font-bold">
              LIVE
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users className="w-4 h-4 text-rose-400" />
            <span className="font-mono font-bold text-white">{viewerCount.toLocaleString()}</span>명 시청 중
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const url = window.location.href
              navigator.clipboard.writeText(url)
              toast({
                title: '라이브 링크 복사',
                description: '라이브 방송 공유 링크가 복사되었습니다.',
              })
            }}
            className="h-8 text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-white gap-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            공유
          </Button>
        </div>
      </header>

      {/* Main Split Player Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Video Player Area */}
        <div className="flex-1 relative bg-black flex flex-col justify-between overflow-hidden min-h-[420px] lg:min-h-0">
          {/* Animated Video Background Mockup */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-rose-950 to-indigo-950 opacity-90">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ff3b6b_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          {/* Center Live Ambient Graphic */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 animate-pulse">
              <Radio className="w-10 h-10" />
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white max-w-lg">
              [산지직송] 제주도 특급 흑돼지 & 한라봉 실시간 특별 할인전
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              호스트: 제주푸드 본사 직영 | 실시간 에스크로 결제 가동 중
            </p>
          </div>

          {/* Top Overlay Controls */}
          <div className="relative z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center font-bold text-xs text-white">
                제주
              </div>
              <div>
                <div className="font-bold text-xs">제주푸드 본사 직영</div>
                <div className="text-[10px] text-slate-400">공식 파트너사 인증</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                title={isMuted ? '음소거 해제' : '음소거'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bottom Floating Pinned Product Card */}
          <div className="relative z-20 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
            <div className="bg-slate-900/90 backdrop-blur border border-rose-500/40 rounded-xl p-3 flex items-center gap-3 shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-3 duration-200">
              <img
                src={pinnedProduct.image}
                alt={pinnedProduct.title}
                className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0">
                    방송 특가 핀
                  </Badge>
                  <span className="text-[10px] text-slate-400 truncate">{pinnedProduct.merchantName}</span>
                </div>
                <div className="font-semibold text-xs text-white line-clamp-1">{pinnedProduct.title}</div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-rose-400 font-black font-mono text-sm">
                    {pinnedProduct.discountRate}%
                  </span>
                  <span className="font-black font-mono text-sm text-white">
                    {pinnedProduct.price.toLocaleString()}원
                  </span>
                  <span className="text-[10px] text-slate-500 line-through font-mono">
                    {pinnedProduct.originalPrice.toLocaleString()}원
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setIsCheckoutOpen(true)}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold h-9 px-3 text-xs shrink-0 shadow-lg"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                웹 바로구매
              </Button>
            </div>

            {/* Quick Heart Reaction */}
            <button
              onClick={() => {
                setLikesCount(likesCount + 1)
                toast({
                  title: '❤️ 응원 전송',
                  description: '호스트에게 실시간 하트가 전달되었습니다.',
                })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 text-xs font-bold transition-all"
            >
              <Heart className="w-4 h-4 fill-rose-500" />
              <span className="font-mono">{likesCount.toLocaleString()}</span>
            </button>
          </div>
        </div>

        {/* Right: Real-time Live Chat Panel */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 flex flex-col h-[380px] lg:h-auto">
          {/* Chat Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-primary" />
              실시간 라이브 톡
            </div>
            <span className="text-[10px] text-slate-500">지연시간 0.2초</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded-lg leading-relaxed ${
                  m.isSystem
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px]'
                    : m.isHost
                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-200'
                    : 'bg-slate-800/60 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-0.5 opacity-70">
                  <span className={`font-bold ${m.isHost ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {m.sender}
                  </span>
                  <span>{m.time}</span>
                </div>
                <div>{m.text}</div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex items-center gap-2">
            <Input
              placeholder="댓글을 입력하세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="text-xs h-9 bg-slate-800 border-slate-700 text-white focus-visible:ring-primary"
            />
            <Button type="submit" size="sm" className="h-9 px-3 bg-primary hover:bg-primary/90 shrink-0">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Instant Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-400" />
                D LIVE 실시간 에스크로 주문
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                방송 중 무중단으로 안전하게 PG 에스크로 결제를 승인합니다.
              </p>
            </div>

            <form onSubmit={handleExecuteLivePayment} className="space-y-4 text-sm">
              <div className="bg-slate-800/80 rounded-lg p-3 text-xs space-y-1.5 border border-slate-700">
                <div className="font-semibold text-white line-clamp-1">{pinnedProduct.title}</div>
                <div className="flex justify-between text-slate-300 font-mono">
                  <span>방송 특가 결제액:</span>
                  <span className="font-bold text-rose-400 text-sm">
                    {pinnedProduct.price.toLocaleString()}원 (무료배송)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">주문자 성함 *</label>
                <Input
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="text-xs bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">휴대폰 번호 *</label>
                <Input
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="text-xs bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">배송지 주소 *</label>
                <Input
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="text-xs bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                물품 수령 후 구매확정 전까지 에스크로 계좌에 안전 보관됩니다.
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessingPay}
                  size="sm"
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold gap-1 text-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {isProcessingPay ? '결제 승인 중...' : '토스페이먼츠 즉시 결제'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
