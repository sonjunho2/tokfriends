import { redirect } from 'next/navigation'

export default function MarketIndexPage() {
  // 모꼬마켓 접속 시 메인 웹의 마켓(중고거래 탭)으로 즉시 연결
  redirect('/?tab=MARKET&sub=C2C_USED')
}

