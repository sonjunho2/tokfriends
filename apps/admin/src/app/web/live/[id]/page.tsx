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
  isJoin?: boolean
  isGift?: boolean
  gift?: { name: string; amount?: number; icon?: string }
  time: string
}

export default function WebLivePlayerPage() {
  const params = useParams()
  const liveId = (params?.id as string) || 'live-101'
  const { toast } = useToast()

  // Video & Stream State
  const [isMuted, setIsMuted] = useState(true)
  const isMutedRef = useRef(isMuted)
  isMutedRef.current = isMuted
  const [likesCount, setLikesCount] = useState(3840)
  const [viewerCount, setViewerCount] = useState(1420)
  const [streamConnecting, setStreamConnecting] = useState(true)
  const [streamPlaying, setStreamPlaying] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const agoraClientRef = useRef<any>(null)
  const remoteAudioTrackRef = useRef<any>(null)
  const remoteVideoTrackRef = useRef<any>(null)

  // Agora WebRTC Realtime Stream Integration
  useEffect(() => {
    let unmounted = false

    const initStream = async () => {
      try {
        setStreamConnecting(true)

        if (!(window as any).AgoraRTC) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.22.0.js'
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Agora SDK 로드 실패'))
            document.head.appendChild(script)
          })
        }

        if (unmounted) return

        let tokenData: any = null
        try {
          const res: any = await api.get(`/live/rooms/${liveId}/agora-token?role=subscriber`)
          tokenData = res?.data ?? res
        } catch {
          tokenData = {
            appId: 'mocco_agora_live',
            token: '',
            channelName: liveId,
            uid: Math.floor(Math.random() * 900000) + 100000,
          }
        }

        if (!tokenData?.appId || unmounted) return

        const AgoraRTC = (window as any).AgoraRTC
        AgoraRTC.setLogLevel(2)
        const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
        agoraClientRef.current = client

        await client.setClientRole('audience', { level: 1 })

        client.on('user-published', async (user: any, mediaType: string) => {
          try {
            await client.subscribe(user, mediaType)
            if (mediaType === 'video') {
              remoteVideoTrackRef.current = user.videoTrack
              setStreamPlaying(true)
              setStreamConnecting(false)
              if (videoContainerRef.current) {
                videoContainerRef.current.innerHTML = ''
                try {
                  user.videoTrack.play(videoContainerRef.current, { fit: 'cover' })
                  const vid = videoContainerRef.current.querySelector('video')
                  if (vid) {
                    vid.muted = true
                    vid.setAttribute('playsinline', 'true')
                    vid.setAttribute('webkit-playsinline', 'true')
                    vid.play().catch(() => {})
                  }
                } catch (playErr) {
                  console.warn('Video play warning:', playErr)
                }
              }
            }
            if (mediaType === 'audio') {
              remoteAudioTrackRef.current = user.audioTrack
              if (!isMutedRef.current) {
                try {
                  user.audioTrack.play()
                } catch (audioErr) {
                  console.warn('Audio play warning:', audioErr)
                }
              }
            }
          } catch (subErr) {
            console.error('Web Agora subscribe error:', subErr)
          }
        })

        client.on('user-unpublished', (user: any, mediaType: string) => {
          if (mediaType === 'video') {
            setStreamPlaying(false)
          }
        })

        await client.join(
          tokenData.appId,
          tokenData.channelName || liveId,
          tokenData.token && tokenData.token.length > 5 ? tokenData.token : null,
          tokenData.uid || null
        )

        // 이미 방송 중인 호스트(remoteUsers) 트랙 자동 구독
        if (client.remoteUsers && client.remoteUsers.length > 0) {
          for (const rUser of client.remoteUsers) {
            if (rUser.hasVideo) {
              try {
                await client.subscribe(rUser, 'video')
                remoteVideoTrackRef.current = rUser.videoTrack
                setStreamPlaying(true)
                if (videoContainerRef.current) {
                  videoContainerRef.current.innerHTML = ''
                  rUser.videoTrack.play(videoContainerRef.current, { fit: 'cover' })
                  const vid = videoContainerRef.current.querySelector('video')
                  if (vid) {
                    vid.muted = true
                    vid.setAttribute('playsinline', 'true')
                    vid.setAttribute('webkit-playsinline', 'true')
                    vid.play().catch(() => {})
                  }
                }
              } catch (e) {}
            }
            if (rUser.hasAudio) {
              try {
                await client.subscribe(rUser, 'audio')
                remoteAudioTrackRef.current = rUser.audioTrack
                if (!isMutedRef.current) {
                  try { rUser.audioTrack.play() } catch {}
                }
              } catch (e) {}
            }
          }
        }

        setStreamConnecting(false)
      } catch (err: any) {
        console.warn('Agora WebRTC init notice:', err?.message || err)
        setStreamConnecting(false)
      }
    }

    initStream()

    return () => {
      unmounted = true
      if (agoraClientRef.current) {
        try {
          agoraClientRef.current.leave()
        } catch {}
      }
    }
  }, [liveId])

  const resumePlayback = () => {
    if (remoteAudioTrackRef.current && !isMuted) {
      try { remoteAudioTrackRef.current.play() } catch {}
    }
    if (remoteVideoTrackRef.current && videoContainerRef.current) {
      try {
        if (!videoContainerRef.current.querySelector('video')) {
          remoteVideoTrackRef.current.play(videoContainerRef.current, { fit: 'cover' })
        }
        const vids = videoContainerRef.current.querySelectorAll('video')
        vids.forEach((v) => {
          v.setAttribute('playsinline', 'true')
          v.setAttribute('webkit-playsinline', 'true')
          v.play().catch(() => {})
        })
      } catch (e) {}
    }
  }

  useEffect(() => {
    if (remoteVideoTrackRef.current && videoContainerRef.current) {
      try {
        if (!videoContainerRef.current.querySelector('video')) {
          remoteVideoTrackRef.current.play(videoContainerRef.current, { fit: 'cover' })
        }
      } catch (e) {}
    }
  }, [streamPlaying])

  useEffect(() => {
    resumePlayback()
  }, [isMuted])

  // Floating Pinned Product
  const pinnedProduct = {
    id: 'np-001',
    title: '[모꼬 LIVE 단독특가] 제주 산지직송 1등급 흑돼지 오겹살 1kg',
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
      text: '모꼬(MOCCO) 실시간 라이브 방송에 오신 것을 환영합니다! 에스크로 안전결제로 방송 특가 상품을 바로 구매하실 수 있습니다.',
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

  // 서버 실시간 채팅/입장 메시지 2.5초 주기 동기화
  useEffect(() => {
    const fetchServerMessages = async () => {
      try {
        const res: any = await api.get(`/live/rooms/${liveId}/messages`)
        const list = res?.data || res
        if (Array.isArray(list) && list.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            const newItems: ChatMessage[] = []
            for (const item of list) {
              if (!existingIds.has(item.id)) {
                const isEnter = item.systemType === 'USER_JOIN' || item.type === 'USER_JOIN' || (item.type === 'SYSTEM' && (item.content || item.text || '').includes('입장'))
                const isGift = item.type === 'gift' || Boolean(item.gift)
                newItems.push({
                  id: item.id,
                  sender: item.senderName || item.sender?.name || item.sender || '시청자',
                  text: item.content || item.text || '',
                  isHost: Boolean(item.isHost),
                  isSystem: Boolean(item.type === 'SYSTEM' || item.isSystem),
                  isJoin: isEnter,
                  isGift,
                  time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                })
              }
            }
            if (newItems.length === 0) return prev
            return [...prev, ...newItems]
          })
        }
      } catch {}
    }

    fetchServerMessages()
    const interval = setInterval(fetchServerMessages, 2500)
    return () => clearInterval(interval)
  }, [liveId])

  // Periodic random chat & join simulator
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
      const isJoinMock = Math.random() < 0.25

      const newMsg: ChatMessage = isJoinMock ? {
        id: `m-join-${Date.now()}`,
        sender: randomNick,
        text: '입장',
        isJoin: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      } : {
        id: `m-${Date.now()}`,
        sender: randomNick,
        text: randomTexts[Math.floor(Math.random() * randomTexts.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev.slice(-40), newMsg])
    }, 5500)

    return () => clearInterval(timer)
  }, [])

  // Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const trimmed = chatInput.trim()
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: '나 (웹 시청자)',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, newMsg])
    setChatInput('')

    // 서버로 실시간 전송 (앱 스트리머 화면에 도달)
    api.post(`/live/rooms/${liveId}/messages`, {
      type: 'chat',
      content: trimmed,
      senderName: '나 (웹 시청자)',
    }).catch(() => {})
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
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            모꼬 웹 스토어 복귀
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-sm tracking-tight">MOCCO LIVE PLAYER</span>
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
        <div
          onClick={resumePlayback}
          onTouchStart={resumePlayback}
          className="flex-1 relative bg-black flex flex-col justify-between overflow-hidden min-h-[420px] lg:min-h-0 cursor-pointer"
        >
          {/* Agora Remote WebRTC Live Video Layer */}
          <div
            ref={videoContainerRef}
            className={`absolute inset-0 z-10 w-full h-full overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover ${
              streamPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } transition-opacity duration-300`}
          />

          {/* Center Live Ambient Graphic / Waiting Screen */}
          {!streamPlaying && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 animate-pulse">
                <Radio className="w-10 h-10" />
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white max-w-lg">
                실시간 라이브 방송 신호 수신 중
              </h1>
              <p className="text-xs text-slate-400 mt-2">
                {streamConnecting
                  ? 'Agora 실시간 고화질 스트림 연결 중...'
                  : '호스트 방송 신호 수신 대기 중입니다.'}
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none z-10" />

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
            {messages.map((m) => {
              // 1. 시청자 입장 메시지 (선물 카드처럼 예쁜 하이라이트 카드 스타일)
              if (m.isJoin || (m.isSystem && m.text.includes('입장'))) {
                return (
                  <div
                    key={m.id}
                    className="rounded-xl p-2.5 bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border border-purple-500/40 text-white shadow-sm flex items-center gap-2.5 my-1 animate-in fade-in duration-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0 text-xs">
                      👋
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-black text-purple-300 mr-1.5">
                        {((m as any).nickname || (m.sender !== '시스템' ? m.sender : '') || m.text?.replace(/^[✨👋\s]+/, '').replace(/님이.*$/, '').trim() || '시청자').replace(/\(시청자\)$/, '').trim()}
                      </span>
                      <span className="text-slate-300 text-[11px]">님이 입장하셨습니다 ✨</span>
                    </div>
                  </div>
                )
              }

              // 2. 선물 후원 메시지
              if (m.isGift) {
                return (
                  <div
                    key={m.id}
                    className="rounded-xl p-2.5 bg-gradient-to-r from-pink-950/80 via-rose-950/80 to-slate-900 border border-pink-500/50 text-white shadow-md flex items-center justify-between gap-2 my-1 animate-in fade-in duration-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{m.gift?.icon || '🎁'}</span>
                      <div className="min-w-0">
                        <span className="text-[11px] text-pink-300 font-bold block truncate">
                          {m.sender} 님이 선물 후원!
                        </span>
                        <span className="text-xs font-black text-amber-300 block truncate">
                          {m.gift?.name || m.text}
                        </span>
                      </div>
                    </div>
                    {m.gift?.amount && (
                      <span className="text-[10px] font-black bg-pink-500/30 text-pink-200 px-2 py-0.5 rounded-full shrink-0 border border-pink-400/30">
                        +{m.gift.amount.toLocaleString()} 꿀떡
                      </span>
                    )}
                  </div>
                )
              }

              // 3. 시스템 공지
              if (m.isSystem) {
                return (
                  <div
                    key={m.id}
                    className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-2 text-blue-300 text-[11px] leading-relaxed"
                  >
                    <span className="font-bold text-blue-400 mr-1.5">[공지]</span>
                    {m.text}
                  </div>
                )
              }

              // 4. 일반 채팅 (스트리머 vs 시청자 명확한 색상 및 배지 구분: 방장은 황금빛 앰버/골드, 선물은 핑크/로즈로 100% 구분)
              const isStreamer = m.isHost || m.sender?.includes('호스트') || m.sender?.includes('방장') || m.sender?.includes('제주흑돈직영')
              return (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl leading-relaxed transition-all ${
                    isStreamer
                      ? 'bg-gradient-to-r from-amber-950/80 via-yellow-950/60 to-slate-900 border border-amber-500/70 shadow-lg text-white'
                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1 opacity-90">
                    <div className="flex items-center gap-1.5">
                      {isStreamer && (
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                          👑 방장
                        </span>
                      )}
                      <span className={`font-black ${isStreamer ? 'text-amber-300 text-xs' : 'text-sky-300 font-bold'}`}>
                        {m.sender}
                      </span>
                    </div>
                    <span className={isStreamer ? 'text-amber-400/60 font-mono text-[9px]' : 'text-slate-500 font-mono text-[9px]'}>{m.time}</span>
                  </div>
                  <div className={`break-words ${isStreamer ? 'text-amber-50 font-semibold' : 'text-slate-200'}`}>
                    {m.text}
                  </div>
                </div>
              )
            })}
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
