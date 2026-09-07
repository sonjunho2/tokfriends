'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          cache: 'no-store',
        })
        const session = await response.json().catch(() => null)

        if (response.ok && session?.authenticated && session?.user?.role === 'admin') {
          router.push('/dashboard')
          return
        }
      } catch {}

      router.push('/login')
    })()
  }, [router])

  return null
}
