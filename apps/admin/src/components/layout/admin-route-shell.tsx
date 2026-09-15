import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminRouteShellProps {
  title: string
  description: string
  icon: LucideIcon
  relatedHref?: string
  relatedLabel?: string
}

export function AdminRouteShell({ title, description, icon: Icon, relatedHref, relatedLabel }: AdminRouteShellProps) {
  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="border-b pb-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden /></div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
    </header>
    <section className="rounded-lg border bg-background p-5">
      <p className="text-sm font-medium">Navigation foundation ready</p>
      <p className="mt-1 text-sm text-muted-foreground">이 영역은 관리자 정보 구조를 위한 안전한 route shell만 제공합니다. 실제 비즈니스 기능과 권한 모델은 포함하지 않습니다.</p>
      {relatedHref && relatedLabel && <Button asChild variant="outline" size="sm" className="mt-4"><Link href={relatedHref}>{relatedLabel}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
    </section>
  </div>
}
