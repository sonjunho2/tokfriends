'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { checkHealth, loginWithEmail, saveLoginResult } from '@/lib/api'
import { AdminAuthError, ensureDefaultSuperAdminAccount } from '@/lib/admin-auth'
import type { AxiosError } from 'axios'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [health, setHealth] = useState<'ok' | 'bad' | 'idle'>('idle')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await checkHealth()
        if (!mounted) return
        const okFlag =
          (res as any)?.ok === true ||
          (res as any)?.status === 'ok' ||
          res === true ||
          (res as any)?.healthy === true
        setHealth(okFlag ? 'ok' : 'bad')
      } catch {
        if (!mounted) return
        setHealth('bad')
      }
    })()
    return () => { mounted = false }
  }, [])

  function logAxios(prefix: string, err: unknown, level: 'warn' | 'error' = 'warn') {
    const ax = err as AxiosError | undefined
    const baseURL = ax?.config?.baseURL ?? ''
    const url = ax?.config?.url ?? ''
    const status = ax?.response?.status
    const data = ax?.response?.data
    const message = (ax?.message ?? (err as any)?.message ?? String(err)).toString()
    // eslint-disable-next-line no-console
    console[level](prefix, { url: `${baseURL}${url}`, status, data, message })
  }

  const handleLoginClick = async () => {
    const identifierInput = document.getElementById('identifier') as HTMLInputElement | null
    const passwordInput = document.getElementById('password') as HTMLInputElement | null

    const data = {
      email: identifierInput?.value?.trim() || '',
      password: passwordInput?.value || '',
    }

    if (!data.email || !data.password) {
      toast({ title: '입력 오류', description: '관리자 아이디(이메일)와 비밀번호를 입력해주세요.', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      ensureDefaultSuperAdminAccount()
      // ✅ 이메일 기반 로그인 엔드포인트 (로컬 슈퍼 관리자 계정 fallback 포함)
      const result = await loginWithEmail(data)

      if (result?.token || result?.access_token) {
        saveLoginResult(result)
        toast({ title: '로그인 성공', description: '관리자 대시보드로 이동합니다.' })
        router.push('/dashboard')
        return
      }

      // 응답은 200인데 토큰이 없을 때
      throw new Error('서버 응답에 토큰이 없습니다.')
    } catch (err) {
      if (err instanceof AdminAuthError) {
        toast({ title: '로그인 실패', description: err.message, variant: 'destructive' })
        return
      }
      logAxios('[Login Error]', err, 'error')

      const ax = err as AxiosError | undefined
      const status = ax?.response?.status
      const serverMsg = (ax?.response?.data as any)?.message
      const msg =
        status === 401
          ? '아이디 또는 비밀번호가 올바르지 않습니다.'
          : Array.isArray(serverMsg)
          ? serverMsg.join(', ')
          : (serverMsg || ax?.message || '로그인에 실패했습니다.')

      toast({ title: `로그인 실패${status ? ` (${status})` : ''}`, description: String(msg), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>딱친 관리자 로그인</CardTitle>
          <CardDescription>
            관리자 계정으로 로그인하세요
            {health === 'ok' && <span className="ml-2 text-green-600 text-xs">(서버 연결 OK)</span>}
            {health === 'bad' && <span className="ml-2 text-red-600 text-xs">(서버 연결 불안정)</span>}
            <div className="mt-2 space-y-1 rounded-md bg-muted/40 p-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                기본 슈퍼 관리자 계정: <strong>admin@example.com</strong> / <strong>Admin123!</strong>
              </p>
              <p>로그인 후 설정 &gt; 팀 관리에서 비밀번호를 변경하고 부관리자를 생성하세요.</p>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">관리자 아이디 (이메일)</Label>
              <Input
                id="identifier"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" type="password" autoComplete="current-password" disabled={isLoading} />
            </div>
            <Button type="button" onClick={handleLoginClick} className="w-full" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
