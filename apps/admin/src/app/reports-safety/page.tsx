import { ShieldAlert } from 'lucide-react'
import { AdminRouteShell } from '@/components/layout/admin-route-shell'

export default function ReportsSafetyPage() {
  return <AdminRouteShell title="Reports & Safety" description="신고 검토와 커뮤니티 안전 운영을 위한 관리자 IA 진입점입니다." icon={ShieldAlert} relatedHref="/chats" relatedLabel="Chat safety 열기" />
}
