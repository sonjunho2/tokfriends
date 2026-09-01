import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROJECT_PACKAGE_NAME = 'tokfriends-admin-web'

function resolveProjectRoot(): string {
  const seen = new Set<string>()
  const candidateOrigins = [
    process.env.ADMIN_ENV_ROOT,
    process.cwd(),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '../..'),
    path.join(process.cwd(), '../../..'),
  ].filter(Boolean) as string[]

  const isProjectRoot = (dir: string) => {
    if (seen.has(dir)) {
      return false
    }
    seen.add(dir)

    try {
      const pkgPath = path.join(dir, 'package.json')
      if (!existsSync(pkgPath)) {
        return false
      }

      const pkgRaw = readFileSync(pkgPath, 'utf8')
      const pkg = JSON.parse(pkgRaw) as { name?: string; dependencies?: Record<string, unknown> }
      if (pkg?.name === PROJECT_PACKAGE_NAME) {
        return true
      }
      if (pkg?.dependencies && 'next' in pkg.dependencies) {
        return true
      }
    } catch {
      return false
    }

    return false
  }

  for (const origin of candidateOrigins) {
    let current = path.resolve(origin)
    for (let depth = 0; depth < 6; depth += 1) {
      if (isProjectRoot(current)) {
        return current
      }
      const parent = path.dirname(current)
      if (parent === current) {
        break
      }
      current = parent
    }
  }

  return path.resolve(process.cwd())
}

const ENV_KEY = 'EXPO_PUBLIC_ADMIN_OVERRIDE_CODES'
const ENV_FILE_PATH = path.join(resolveProjectRoot(), '.env.local')

function normalizeCodes(input: unknown): string[] {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return input.map((code) => String(code).trim()).filter((code) => code.length > 0)
  }

  return String(input)
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code.length > 0)
}

function validateCodes(codes: string[]): string | null {
  const invalid = codes.filter((code) => !/^\d{4,10}$/.test(code))
  if (invalid.length > 0) {
    return `4~10자리 숫자 코드만 입력할 수 있습니다: ${invalid.join(', ')}`
  }
  return null
}

function extractCodesFromEnv(content: string | null): string[] {
  if (!content) {
    const fallback = process.env[ENV_KEY]
    return fallback ? normalizeCodes(fallback) : []
  }
  // content가 없을 때(.env.local 파일이 없거나 키가 없는 경우)에는
  // 환경변수를 우선 사용하되 값이 없으면 '123456'을 기본값으로 사용합니다.
  if (!content) {
    const fallbackEnv = process.env[ENV_KEY]
    const fallback =
      fallbackEnv && String(fallbackEnv).trim().length > 0 ? fallbackEnv : '123456'
    return normalizeCodes(fallback)
  }
  
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    if (line.startsWith(`${ENV_KEY}=`)) {
      const value = line.slice(ENV_KEY.length + 1)
      return normalizeCodes(value)
    }
  }

  const fallback = process.env[ENV_KEY]
  return fallback ? normalizeCodes(fallback) : []
}

async function readEnvFile(): Promise<string | null> {
  try {
    return await fs.readFile(ENV_FILE_PATH, 'utf8')
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function ensureTrailingNewline(content: string): string {
  if (!content) {
    return ''
  }
  return content.endsWith('\n') ? content : `${content}\n`
}

function buildUpdatedEnv(existing: string | null, codes: string[]): string {
  const lines = existing ? existing.split(/\r?\n/) : []
  const filtered: string[] = []

  for (const line of lines) {
    if (!line) {
      if (filtered.length === 0) {
        continue
      }
      filtered.push(line)
      continue
    }

    if (line.startsWith(`${ENV_KEY}=`)) {
      continue
    }

    filtered.push(line)
  }

  while (filtered.length > 0 && filtered[filtered.length - 1] === '') {
    filtered.pop()
  }

  if (codes.length > 0) {
    if (filtered.length > 0) {
      filtered.push('')
    }
    filtered.push(`${ENV_KEY}=${codes.join(',')}`)
  }

  const joined = filtered.join('\n')
  return ensureTrailingNewline(joined)
}

export async function GET() {
  const content = await readEnvFile()
  const codes = extractCodesFromEnv(content)
  return NextResponse.json({ codes })
}

export async function PUT(request: Request) {
  const payload = await request.json().catch(() => ({}))
  const codes = normalizeCodes(payload.codes)

  const validationError = validateCodes(codes)
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 })
  }

  const existing = await readEnvFile()
  const nextContent = buildUpdatedEnv(existing, codes)

  try {
    await fs.mkdir(path.dirname(ENV_FILE_PATH), { recursive: true })
    await fs.writeFile(ENV_FILE_PATH, nextContent, 'utf8')
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    const description = err?.message || '관리자 인증번호를 저장하지 못했습니다.'
    return NextResponse.json({ message: description }, { status: 500 })
  }

  return NextResponse.json({ codes })
}
