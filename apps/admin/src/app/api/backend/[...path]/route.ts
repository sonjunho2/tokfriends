import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'tokfriends_admin_session'

type RouteContext = {
  params: {
    path: string[]
  }
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const apiBase = process.env.TOK_API_BASE_URL?.replace(/\/+$/, '')

  if (!apiBase) {
    return NextResponse.json({ message: 'Admin API configuration is missing.' }, { status: 500 })
  }

  const path = context.params.path.map((segment) => encodeURIComponent(segment)).join('/')
  const targetUrl = new URL(`${apiBase}/v1/${path}`)
  targetUrl.search = request.nextUrl.search

  const isStateChangingRequest = !['GET', 'HEAD', 'OPTIONS'].includes(request.method)

  if (isStateChangingRequest) {
    const origin = request.headers.get('origin')

    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json({ message: 'Invalid request origin.' }, { status: 403 })
    }
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const isPublicHealthCheck = path === 'health'

  if (!token && !isPublicHealthCheck) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })
  }

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  const accept = request.headers.get('accept')

  if (contentType) headers.set('Content-Type', contentType)
  if (accept) headers.set('Accept', accept)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const hasBody = !['GET', 'HEAD'].includes(request.method)
  const body = hasBody ? await request.arrayBuffer() : undefined

  let upstream: Response
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    })
  } catch {
    return NextResponse.json({ message: 'Admin API is unavailable.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }

  const responseHeaders = new Headers()
  responseHeaders.set('Cache-Control', 'no-store')
  const upstreamContentType = upstream.headers.get('content-type')
  if (upstreamContentType) {
    responseHeaders.set('Content-Type', upstreamContentType)
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}
