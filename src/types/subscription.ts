export interface PaddleBillingCycle {
  frequency?: number
  interval?: string
}

export interface PaddleUnitPrice {
  amount?: string
  currencyCode?: string
  currency_code?: string
}

export interface PaddlePriceData {
  id?: string
  productId?: string
  name?: string
  description?: string
  billingCycle?: PaddleBillingCycle | null
  unitPrice?: PaddleUnitPrice | null
  status?: string
  customData?: Record<string, unknown>
}

export interface SubscriptionPlan {
  id: number
  planCode: string
  scene?: string
  name: string
  durationDays: number
  priceMode?: 'one_time' | 'recurring'
  isGift: boolean
  originalPrice: number
  discountPrice?: number
  currencyCode: string
  createdAt: string
  updatedAt: string
  isDeleted: number
  isActive: number
  version: number
  paddleProductId?: string
  paddlePriceId?: string
  paddlePrice?: PaddlePriceData
}

export interface SubscriptionPlanDTO {
  id?: number
  planCode: string
  scene?: string
  name: string
  durationDays: number
  priceMode?: 'one_time' | 'recurring'
  isGift?: boolean
  originalPrice: number
  discountPrice?: number
  currencyCode: string
  isActive?: boolean
}
