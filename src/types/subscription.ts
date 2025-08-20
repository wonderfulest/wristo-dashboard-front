export interface SubscriptionPlan {
  id: number
  planCode: string
  name: string
  durationDays: number
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
}

export interface SubscriptionPlanDTO {
  id?: number
  planCode: string
  name: string
  durationDays: number
  isGift?: boolean
  originalPrice: number
  discountPrice?: number
  currencyCode: string
  isActive?: boolean
}

