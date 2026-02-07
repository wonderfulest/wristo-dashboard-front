export interface PromoterCouponVO {
  id: number
  couponCode: string
  promoterId: number
  campaignId?: number | null
  description?: string | null
  discountType: string
  discountValue: number
  paddleDiscountId?: string | null
  commissionRate: number
  maxUse?: number | null
  usedCount?: number | null
  status?: number | null
  expireAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface PromoterCouponQueryDTO {
  pageNum: number
  pageSize: number
  couponCodeLike?: string | null
  promoterId?: number | null
  status?: number | null
  orderBy?: string | null
}

export interface PromoterCouponCreateDTO {
  couponCode: string
  promoterId: number
  campaignId?: number | null
  description?: string | null
  discountType: string
  discountValue: number
  commissionRate: number
  maxUse?: number | null
  status?: number | null
  expireAt?: string | null
}

export interface PromoterCouponUpdateDTO {
  id: number
  couponCode?: string
  promoterId?: number | null
  campaignId?: number | null
  description?: string | null
  discountType?: string
  discountValue?: number
  paddleDiscountId?: string | null
  commissionRate?: number
  maxUse?: number | null
  usedCount?: number | null
  status?: number | null
  expireAt?: string | null
}
