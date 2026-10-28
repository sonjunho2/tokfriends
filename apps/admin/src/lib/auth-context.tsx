'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

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
  avatarUrl?: string
  pointBalance: number
  cashBalance?: number
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
  switchRole: (newRole: UserRole) => void
  applyMerchant: (data: MerchantApplication) => Promise<boolean>
  applyCreator: (data: CreatorApplication) => Promise<boolean>
  logout: () => void
  requireAuth: (callback: () => void) => void
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

  // Initialize from storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.role && parsed.role !== 'GUEST') {
          setUser(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

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

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (user && user.role !== 'GUEST') {
        callback()
      } else {
        openLoginModal(callback)
      }
    },
    [user, openLoginModal]
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

  const logout = useCallback(() => {
    saveUserState(null)
  }, [saveUserState])

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
        emailLogin,
        switchRole,
        applyMerchant,
        applyCreator,
        logout,
        requireAuth,
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

