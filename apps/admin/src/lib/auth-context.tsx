'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export type UserRole = 'GUEST' | 'USER' | 'MERCHANT' | 'CREATOR' | 'ADMIN'

export interface MerchantApplication {
  businessName: string
  businessNumber: string
  representative: string
  onlineOrderNumber?: string
  contactPhone: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

export interface CreatorApplication {
  channelName: string
  category: string
  bio: string
  activeTime?: string
}

export interface WebUser {
  id: string
  nickname: string
  email?: string
  role: UserRole
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  banReason?: string
  banExpiresAt?: string
  avatarUrl?: string
  pointBalance: number
  cashBalance?: number
  chatEntryFee?: number
  liveEntryFee?: number
  merchantInfo?: MerchantApplication
  creatorInfo?: CreatorApplication
}

interface AuthContextType {
  user: WebUser | null
  role: UserRole
  isAuthenticated: boolean
  isLoginModalOpen: boolean
  openLoginModal: (redirectAction?: () => void) => void
  closeLoginModal: () => void
  isMerchantModalOpen: boolean
  openMerchantModal: () => void
  closeMerchantModal: () => void
  isCreatorModalOpen: boolean
  openCreatorModal: () => void
  closeCreatorModal: () => void
  quickLogin: (nickname: string) => Promise<boolean>
  emailLogin: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>
  socialLogin: (
    provider: 'kakao' | 'naver' | 'google' | 'apple',
    customProfile?: { email?: string; nickname?: string; avatarUrl?: string }
  ) => Promise<boolean>
  switchRole: (newRole: UserRole) => void
  applyMerchant: (data: MerchantApplication) => Promise<boolean>
  applyCreator: (data: CreatorApplication) => Promise<boolean>
  logout: () => void
  requireAuth: (callback: () => void) => void
  updatePointBalance: (newBalance: number) => void
  rechargePoints: (
    pointsToAdd: number,
    amount: number,
    paymentMethod: string,
    productId?: string
  ) => Promise<{ success: boolean; newBalance: number; transactionId: string }>
  isBannedModalOpen: boolean
  banInfo: { isBanned: boolean; reason?: string; expiresAt?: string } | null
  closeBannedModal: () => void
}

const DEFAULT_GUEST_USER: WebUser | null = null

const PRESET_USERS: Record<UserRole, WebUser> = {
  GUEST: {
    id: 'guest',
    nickname: '게스트',
    role: 'GUEST',
    pointBalance: 0,
    cashBalance: 0,
  },
  USER: {
    id: 'u-user-01',
    nickname: '모꼬이웃_단골',
    email: 'user@tokfriends.com',
    role: 'USER',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    pointBalance: 25000,
    cashBalance: 0,
  },
  MERCHANT: {
    id: 'u-merchant-01',
    nickname: '제주푸드 본사 직영',
    email: 'merchant@tokfriends.com',
    role: 'MERCHANT',
    avatarUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    pointBalance: 50000,
    cashBalance: 420000,
    merchantInfo: {
      businessName: '제주푸드(주)',
      businessNumber: '123-45-67890',
      representative: '김제주',
      onlineOrderNumber: '제2026-제주-0123호',
      contactPhone: '064-700-1234',
      bankName: '국민은행',
      accountNumber: '923402-01-567890',
      accountHolder: '제주푸드(주)',
    },
  },
  CREATOR: {
    id: 'u-creator-01',
    nickname: '별빛소통_민지',
    email: 'creator@tokfriends.com',
    role: 'CREATOR',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    pointBalance: 88000,
    cashBalance: 650000,
    creatorInfo: {
      channelName: '민지의 감성 라디오 & 라이브마켓',
      category: '소통/라이프/뷰티',
      bio: '동네 이웃들과 밤마다 따뜻한 일상을 나누고 엄선한 꿀템을 소개합니다 ✨',
      activeTime: '매일 밤 9시',
    },
  },
  ADMIN: {
    id: 'u-admin-01',
    nickname: '본사 총괄 운영팀',
    email: 'admin@tokfriends.com',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500',
    pointBalance: 9999999,
    cashBalance: 9999999,
  },
}

const STORAGE_KEY = 'tokfriends_web_auth_user'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function WebAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<WebUser | null>(DEFAULT_GUEST_USER)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false)
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  
  // ⛔ 제재 및 이용 정지 상태
  const [isBannedModalOpen, setIsBannedModalOpen] = useState(false)
  const [banInfo, setBanInfo] = useState<{ isBanned: boolean; reason?: string; expiresAt?: string } | null>(null)

  // 제재 여부 검사 유틸리티
  const checkIsUserBanned = useCallback((u: WebUser | null): { banned: boolean; reason?: string; expiresAt?: string } => {
    if (!u) return { banned: false }
    if (u.status === 'SUSPENDED' || u.status === 'BANNED') {
      return { banned: true, reason: u.banReason || '운영정책 위반', expiresAt: u.banExpiresAt }
    }
    try {
      const stored = localStorage.getItem('mocco_banned_users')
      if (stored) {
        const list = JSON.parse(stored)
        const matched = list.find((item: any) => item.id === u.id || item.nickname === u.nickname)
        if (matched) {
          return { banned: true, reason: matched.reason || '이용 제한 조치', expiresAt: matched.expiresAt }
        }
      }
    } catch (e) {
      // ignore
    }
    return { banned: false }
  }, [])

  // Initialize from storage on mount & listen for real-time admin sanctions
  useEffect(() => {
    const loadAndVerify = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.role && parsed.role !== 'GUEST') {
            const check = checkIsUserBanned(parsed)
            if (check.banned) {
              setBanInfo({ isBanned: true, reason: check.reason, expiresAt: check.expiresAt })
              setIsBannedModalOpen(true)
              setUser(null)
              localStorage.removeItem(STORAGE_KEY)
              document.cookie = 'tokfriends_role=; path=/; max-age=0'
              return
            }
            setUser(parsed)
          }
        }
      } catch {
        // ignore
      }
    }

    loadAndVerify()

    // 📡 관리자 제재 집행(영구차단/이용정지) 발생 시 브라우저 세션 실시간 강제 종료
    const onSanctionUpdated = () => {
      loadAndVerify()
    }
    window.addEventListener('mocco_sanction_updated', onSanctionUpdated)
    window.addEventListener('storage', onSanctionUpdated)
    return () => {
      window.removeEventListener('mocco_sanction_updated', onSanctionUpdated)
      window.removeEventListener('storage', onSanctionUpdated)
    }
  }, [checkIsUserBanned])

  const saveUserState = useCallback((newUser: WebUser | null) => {
    setUser(newUser)
    try {
      if (newUser && newUser.role !== 'GUEST') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
        // sync role cookie for backend proxy/middleware if needed
        document.cookie = `tokfriends_role=${newUser.role}; path=/; max-age=604800`
      } else {
        localStorage.removeItem(STORAGE_KEY)
        document.cookie = `tokfriends_role=; path=/; max-age=0`
      }
    } catch {
      // ignore
    }
  }, [])

  const openLoginModal = useCallback((redirectAction?: () => void) => {
    if (redirectAction) {
      setPendingAction(() => redirectAction)
    }
    setIsLoginModalOpen(true)
  }, [])

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false)
  }, [])

  const openMerchantModal = useCallback(() => {
    setIsMerchantModalOpen(true)
  }, [])

  const closeMerchantModal = useCallback(() => {
    setIsMerchantModalOpen(false)
  }, [])

  const openCreatorModal = useCallback(() => {
    setIsCreatorModalOpen(true)
  }, [])

  const closeCreatorModal = useCallback(() => {
    setIsCreatorModalOpen(false)
  }, [])

  const closeBannedModal = useCallback(() => {
    setIsBannedModalOpen(false)
    setBanInfo(null)
  }, [])

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (user && user.role !== 'GUEST') {
        // ⛔ 제재된 회원인지 실시간 검사
        const check = checkIsUserBanned(user)
        if (check.banned) {
          setBanInfo({ isBanned: true, reason: check.reason, expiresAt: check.expiresAt })
          setIsBannedModalOpen(true)
          saveUserState(null) // 세션 강제 만료
          return
        }
        callback()
      } else {
        openLoginModal(callback)
      }
    },
    [user, openLoginModal, checkIsUserBanned, saveUserState]
  )

  const quickLogin = useCallback(
    async (nickname: string) => {
      const cleanNick = nickname.trim() || '모꼬이웃_' + Math.floor(1000 + Math.random() * 9000)
      const newUser: WebUser = {
        id: 'u-' + Date.now(),
        nickname: cleanNick,
        role: 'USER',
        pointBalance: 10000, // 신규 가입 웰컴 포인트 1만P 지급
        cashBalance: 0,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanNick}`,
      }
      saveUserState(newUser)
      setIsLoginModalOpen(false)

      if (pendingAction) {
        pendingAction()
        setPendingAction(null)
      }
      return true
    },
    [pendingAction, saveUserState]
  )

  const emailLogin = useCallback(
    async (email: string, pass: string) => {
      const cleanEmail = email.trim().toLowerCase()

      // 🔴 백엔드 정식 로그인 시도 (test01@te.te, test02@te.te 일반 가입자 role: 'user' 및 실제 JWT 발급)
      try {
        const response = await fetch('/api/backend/auth/login/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: cleanEmail, password: pass }),
        })

        if (response.ok) {
          const resData = await response.json()
          const token = resData.token || resData.access_token || resData.accessToken
          const userData = resData.user || resData.data?.user
          if (token && typeof window !== 'undefined') {
            localStorage.setItem('tokfriends_admin_token', token)
            localStorage.setItem('access_token', token)
          }
          if (userData) {
            const isStreamer = cleanEmail === 'test01@te.te'
            const isViewer = cleanEmail === 'test02@te.te'
            const webUser: WebUser = {
              id: userData.id,
              nickname: userData.nickname || (isStreamer ? '테스터01' : isViewer ? '테스터02' : cleanEmail.split('@')[0]),
              email: userData.email || cleanEmail,
              role: isStreamer ? 'CREATOR' : isViewer ? 'USER' : (userData.role?.toUpperCase() || 'USER'),
              avatarUrl: userData.avatarUrl || (isStreamer
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'),
              pointBalance: Number(userData.pointBalance ?? (isViewer ? 500000 : 100000)),
              cashBalance: Number(userData.cashBalance ?? 100000),
              chatEntryFee: Number(userData.chatEntryFee ?? 300),
              liveEntryFee: Number(userData.liveEntryFee ?? 1000),
              creatorInfo: isStreamer ? {
                channelName: '테스터01의 온에어 라이브 🎙️',
                category: '일상/토크',
                bio: '실시간 라이브 방송 송출 및 선물 후원 테스트용 공식 크리에이터 계정입니다.',
                activeTime: '상시 On-Air',
              } : undefined,
            }
            saveUserState(webUser)
            setIsLoginModalOpen(false)
            if (pendingAction) {
              pendingAction()
              setPendingAction(null)
            }
            return { success: true }
          }
        }
      } catch (err) {
        console.warn('Backend login attempt failed, using fallback:', err)
      }

      // 🔴 네트워크 단절 시 오프라인 폴백 처리
      if (cleanEmail === 'test01@te.te') {
        if (pass && pass !== '12345678') {
          return { success: false, message: '비밀번호가 일치하지 않습니다. (테스트 비밀번호: 12345678)' }
        }
        const hostUser: WebUser = {
          id: '4ed31aef-5b0a-4cac-a13a-48d9e9465efe',
          nickname: '테스터01',
          email: 'test01@te.te',
          role: 'CREATOR',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
          pointBalance: 100000,
          cashBalance: 100000,
          chatEntryFee: 300,
          liveEntryFee: 1000,
          creatorInfo: {
            channelName: '테스터01의 온에어 라이브 🎙️',
            category: '일상/토크',
            bio: '실시간 라이브 방송 송출 및 선물 후원 테스트용 공식 크리에이터 계정입니다.',
            activeTime: '상시 On-Air',
          },
        }
        saveUserState(hostUser)
        setIsLoginModalOpen(false)
        if (pendingAction) {
          pendingAction()
          setPendingAction(null)
        }
        return { success: true }
      }

      if (cleanEmail === 'test02@te.te') {
        if (pass && pass !== '12345678') {
          return { success: false, message: '비밀번호가 일치하지 않습니다. (테스트 비밀번호: 12345678)' }
        }
        const viewerUser: WebUser = {
          id: 'e4b911c9-34c2-4566-bf2c-13a00c5ffed4',
          nickname: '테스터02',
          email: 'test02@te.te',
          role: 'USER',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
          pointBalance: 500000, // 넉넉한 50만 꿀떡으로 VIP 3D 선물 후원 테스트 가능
          cashBalance: 500000,
          chatEntryFee: 300,
          liveEntryFee: 1000,
        }
        saveUserState(viewerUser)
        setIsLoginModalOpen(false)
        if (pendingAction) {
          pendingAction()
          setPendingAction(null)
        }
        return { success: true }
      }

      // 특수 계정 체크
      if (cleanEmail.includes('admin') || cleanEmail === 'admin@dagaon.com' || cleanEmail === 'admin@tokfriends.com') {
        const adminUser = PRESET_USERS.ADMIN
        saveUserState(adminUser)
        setIsLoginModalOpen(false)
        return { success: true }
      }

      if (cleanEmail.includes('seller') || cleanEmail.includes('merchant')) {
        const merchantUser = PRESET_USERS.MERCHANT
        saveUserState(merchantUser)
        setIsLoginModalOpen(false)
        return { success: true }
      }

      if (cleanEmail.includes('creator') || cleanEmail.includes('streamer')) {
        const creatorUser = PRESET_USERS.CREATOR
        saveUserState(creatorUser)
        setIsLoginModalOpen(false)
        return { success: true }
      }

      // 일반 이메일 회원
      const normalUser: WebUser = {
        id: 'u-' + Date.now(),
        nickname: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'USER',
        pointBalance: 20000,
        cashBalance: 0,
      }
      saveUserState(normalUser)
      setIsLoginModalOpen(false)

      if (pendingAction) {
        pendingAction()
        setPendingAction(null)
      }
      return { success: true }
    },
    [pendingAction, saveUserState]
  )

  const switchRole = useCallback(
    (newRole: UserRole) => {
      if (newRole === 'GUEST') {
        saveUserState(null)
      } else {
        saveUserState(PRESET_USERS[newRole])
      }
    },
    [saveUserState]
  )

  const applyMerchant = useCallback(
    async (data: MerchantApplication) => {
      if (!user) return false
      const updatedUser: WebUser = {
        ...user,
        role: 'MERCHANT',
        merchantInfo: data,
        nickname: data.businessName || user.nickname,
      }
      saveUserState(updatedUser)
      setIsMerchantModalOpen(false)
      return true
    },
    [user, saveUserState]
  )

  const applyCreator = useCallback(
    async (data: CreatorApplication) => {
      if (!user) return false
      const updatedUser: WebUser = {
        ...user,
        role: 'CREATOR',
        creatorInfo: data,
        nickname: data.channelName || user.nickname,
      }
      saveUserState(updatedUser)
      setIsCreatorModalOpen(false)
      return true
    },
    [user, saveUserState]
  )

  const socialLogin = useCallback(
    async (
      provider: 'kakao' | 'naver' | 'google' | 'apple',
      customProfile?: { email?: string; nickname?: string; avatarUrl?: string }
    ) => {
      try {
        const defaultProfiles: Record<string, { email: string; nickname: string; avatarUrl: string }> = {
          kakao: {
            email: 'kakao_user@kakao.com',
            nickname: '노란리본_카카오이웃',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
          },
          naver: {
            email: 'naver_user@naver.com',
            nickname: '초록창_네이버쇼퍼',
            avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
          },
          google: {
            email: 'google_user@gmail.com',
            nickname: '스마트_구글이웃',
            avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
          },
          apple: {
            email: 'apple_user@privaterelay.appleid.com',
            nickname: '블랙라벨_애플유저',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
          },
        }

        const profile = customProfile || defaultProfiles[provider] || defaultProfiles.kakao

        // Try calling the backend API to query/create in the Customer DB
        let apiUser: any = null
        try {
          const res = await fetch('/api/backend/auth/oauth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider,
              email: profile.email,
              nickname: profile.nickname,
              avatarUrl: profile.avatarUrl,
            }),
          })
          if (res.ok) {
            const json = await res.json()
            apiUser = json.data?.user || json.user
            if (json.data?.token || json.token) {
              localStorage.setItem('tokfriends_auth_token', json.data?.token || json.token)
            }
          }
        } catch {
          // If backend proxy not reachable, fallback to synchronized local profile
        }

        const loggedInUser: WebUser = {
          id: apiUser?.id || `u-${provider}-${Date.now()}`,
          nickname: apiUser?.nickname || profile.nickname,
          email: apiUser?.email || profile.email,
          role: (apiUser?.role?.toUpperCase() as UserRole) || 'USER',
          pointBalance: apiUser?.pointBalance ?? 10000,
          cashBalance: apiUser?.cashBalance ?? 0,
          avatarUrl: apiUser?.avatarUrl || profile.avatarUrl,
        }

        saveUserState(loggedInUser)
        setIsLoginModalOpen(false)

        if (pendingAction) {
          pendingAction()
          setPendingAction(null)
        }
        return true
      } catch (err) {
        console.error('Social login error:', err)
        return false
      }
    },
    [pendingAction, saveUserState]
  )

  const logout = useCallback(() => {
    saveUserState(null)
  }, [saveUserState])

  const updatePointBalance = useCallback(
    (newBalance: number) => {
      if (!user) return
      const updated = { ...user, pointBalance: newBalance }
      saveUserState(updated)
    },
    [user, saveUserState]
  )

  const rechargePoints = useCallback(
    async (pointsToAdd: number, amount: number, paymentMethod: string, productId?: string) => {
      const txId = `MOC-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`
      try {
        const res = await api.post('/api/backend/store/purchases/confirm', {
          userId: user?.id || 'usr-guest',
          userNickname: user?.nickname || '회원',
          productId: productId || `pkg-${pointsToAdd}`,
          points: pointsToAdd,
          amount: amount,
          paymentMethod: paymentMethod,
          transactionId: txId,
        })
        const newBal = res.data?.newBalance ?? ((user?.pointBalance || 0) + pointsToAdd)
        if (user) {
          saveUserState({ ...user, pointBalance: newBal })
        }
        return { success: true, newBalance: newBal, transactionId: res.data?.id || txId }
      } catch (err) {
        // Fallback optimistic update
        const newBal = (user?.pointBalance || 0) + pointsToAdd
        if (user) {
          saveUserState({ ...user, pointBalance: newBal })
        }
        return { success: true, newBalance: newBal, transactionId: txId }
      }
    },
    [user, saveUserState]
  )

  const role = user?.role || 'GUEST'
  const isAuthenticated = !!user && user.role !== 'GUEST'

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isMerchantModalOpen,
        openMerchantModal,
        closeMerchantModal,
        isCreatorModalOpen,
        openCreatorModal,
        closeCreatorModal,
        quickLogin,
        socialLogin,
        emailLogin,
        switchRole,
        applyMerchant,
        applyCreator,
        logout,
        requireAuth,
        updatePointBalance,
        rechargePoints,
        isBannedModalOpen,
        banInfo,
        closeBannedModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useWebAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useWebAuth must be used within a WebAuthProvider')
  }
  return context
}

