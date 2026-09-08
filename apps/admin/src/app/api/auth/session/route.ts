import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'tokfriends_admin_session'
const UPSTREAM_TIMEOUT_MS = 10_000

export async function GET(request: NextRequest) {
  const apiBase = process.env.TOK_API_BASE_URL?.replace(/\/+$/, '')
  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (!apiBase) {
    return NextResponse.json({ message: 'Admin API configuration is missing.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  if (!token) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  let meResponse: Response
  try {
    meResponse = await fetch(`${apiBase}/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ message: 'Admin API request timed out.' }, { status: 504, headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ message: 'Admin API is unavailable.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }

  const meData = await meResponse.json().catch(() => null)
  const currentUser = meData?.data

  if (!meResponse.ok || currentUser?.role !== 'admin') {
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.headers.set('Cache-Control', 'no-store')
    response.cookies.set({ name: SESSION_COOKIE, value: '', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
    return response
  }

  const response = NextResponse.json({
    authenticated: true,
    user: currentUser,
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
