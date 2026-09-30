import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'tokfriends_admin_session'

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: 'Invalid request origin.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }

  const response = NextResponse.json({ ok: true })
  response.headers.set('Cache-Control', 'no-store')
  response.cookies.set({ name: SESSION_COOKIE, value: '', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
  return response
}
