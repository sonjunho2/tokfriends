import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'tokfriends_admin_session'

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: 'Invalid request origin.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }
  const apiBase = process.env.TOK_API_BASE_URL?.replace(/\/+$/, '')

  if (!apiBase) {
    return NextResponse.json({ message: 'Admin API configuration is missing.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  const body = await request.json()

  const loginResponse = await fetch(`${apiBase}/v1/auth/login/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const loginData = await loginResponse.json().catch(() => null)

  if (!loginResponse.ok) {
    return NextResponse.json(loginData ?? { message: 'Login failed.' }, { status: loginResponse.status, headers: { 'Cache-Control': 'no-store' } })
  }

  const token = loginData?.token || loginData?.access_token

  if (!token) {
    return NextResponse.json({ message: 'Login response did not contain an access token.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }

  const meResponse = await fetch(`${apiBase}/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  const meData = await meResponse.json().catch(() => null)
  const currentUser = meData?.data

  if (!meResponse.ok || currentUser?.role !== 'admin') {
    return NextResponse.json({ message: 'Admin access is required.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }

  const response = NextResponse.json({ ok: true, user: currentUser })
  response.headers.set('Cache-Control', 'no-store')

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
