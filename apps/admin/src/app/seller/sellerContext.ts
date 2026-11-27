import { api } from '@/lib/api'

export interface SellerMerchantInfo {
  id: string
  userId?: string
  businessName?: string
  feeRate?: number
  bankName?: string
  accountNumber?: string
  accountHolder?: string
}

/**
 * Resolves the currently authenticated seller's merchant profile and products.
 * Avoids hardcoding 'mer-001' or 'u-merchant-1' across seller console pages.
 */
export async function resolveSellerMerchant(): Promise<{
  merchant: SellerMerchantInfo | null
  products: any[]
}> {
  try {
    let userIdParam = ''
    if (typeof window !== 'undefined') {
      const rawUser = localStorage.getItem('user')
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser)
          if (parsed?.id) {
            userIdParam = `?userId=${encodeURIComponent(parsed.id)}`
          }
        } catch {
          // ignore malformed localStorage user JSON
        }
      }
    }

    const res = await api.get(`/api/merchants/my${userIdParam}`)
    if (res.data?.ok && res.data?.merchant?.id) {
      return {
        merchant: res.data.merchant,
        products: Array.isArray(res.data.products) ? res.data.products : [],
      }
    }
  } catch (err) {
    console.warn('[SellerContext] Failed to resolve merchant:', err)
  }
  return { merchant: null, products: [] }
}
