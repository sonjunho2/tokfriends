'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { checkHealth, loginWithEmail } from '@/lib/api'
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
      toast({ title: '입력 오류', description: '운영진 관리자 아이디(이메일)와 비밀번호를 입력해주세요.', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      const result = await loginWithEmail(data)

      if (result?.ok) {
        toast({ title: '로그인 성공', description: '총괄 관리자 대시보드로 이동합니다.' })
        router.push('/dashboard')
        return
      }

      throw new Error('로그인 응답을 확인할 수 없습니다.')
    } catch (err) {
      logAxios('[Login Error]', err, 'error')

      const ax = err as AxiosError | undefined
      const status = ax?.response?.status
      const serverMsg = (ax?.response?.data as any)?.message
      const msg =
        status === 401
          ? '운영진 아이디 또는 비밀번호가 올바르지 않습니다.'
          : status === 403
          ? '총괄 관리자 권한이 필요합니다. 회사 운영진만 접속할 수 있습니다.'
          : Array.isArray(serverMsg)
          ? serverMsg.join(', ')
          : (serverMsg || ax?.message || '로그인에 실패했습니다.')

      toast({ title: `로그인 실패${status ? ` (${status})` : ''}`, description: String(msg), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-[420px] shadow-lg border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">
            👑
          </div>
          <CardTitle className="text-xl font-bold">회사 총괄 관리자 콘솔</CardTitle>
          <CardDescription className="text-xs">
            본사 공인 운영진만 접속할 수 있는 보안 영역입니다.
            {health === 'ok' && <span className="block text-emerald-600 text-xs mt-1">● API 서버 통신 정상</span>}
            {health === 'bad' && <span className="block text-rose-600 text-xs mt-1">● API 서버 점검 중</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-semibold">운영진 이메일</Label>
              <Input
                id="identifier"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="admin@tokfriends.com"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={isLoading}
                className="text-xs"
              />
            </div>
            <Button
              type="button"
              onClick={handleLoginClick}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10"
              disabled={isLoading}
            >
              {isLoading ? '운영진 권한 인증 중...' : '관리자 콘솔 로그인'}
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-slate-900 font-semibold transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                고객 웹 스토어 홈으로 돌아가기
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
