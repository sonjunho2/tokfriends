import { ShieldCheck } from 'lucide-react'
import { AdminRouteShell } from '@/components/layout/admin-route-shell'

export default function AdminPermissionsPage() {
  return <AdminRouteShell title="Admin & Permissions" description="기존 RBAC를 유지하면서 관리자와 권한 운영을 연결하는 IA 진입점입니다." icon={ShieldCheck} relatedHref="/settings" relatedLabel="기존 관리자 설정 열기" />
}
