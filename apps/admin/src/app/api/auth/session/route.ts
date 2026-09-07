import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'tokfriends_admin_session'

export async function GET(request: NextRequest) {
  const apiBase = process.env.TOK_API_BASE_URL?.replace(/\/+$/, '')
  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (!apiBase) {
    return NextResponse.json({ message: 'Admin API configuration is missing.' }, { status: 500 })
  }

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const meResponse = await fetch(`${apiBase}/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  const meData = await meResponse.json().catch(() => null)
  const currentUser = meData?.data

  if (!meResponse.ok || currentUser?.role !== 'admin') {
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.cookies.set({ name: SESSION_COOKIE, value: '', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
    return response
  }

  return NextResponse.json({
    authenticated: true,
    user: currentUser,
  })
}
