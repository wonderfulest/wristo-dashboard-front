import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  PromoterCouponVO,
  PromoterCouponQueryDTO,
  PromoterCouponCreateDTO,
  PromoterCouponUpdateDTO,
} from '@/types/promoter-coupon'

const BASE = '/admin/promoter/coupons'

export function fetchPromoterCouponPage(
  dto: PromoterCouponQueryDTO,
): Promise<ApiResponse<PageResponse<PromoterCouponVO>>> {
  return instance.post(`${BASE}/page`, dto)
}

export function listPromoterCoupons(params: {
  couponCodeLike?: string
  promoterId?: number
  status?: string
  orderBy?: string
}): Promise<ApiResponse<PromoterCouponVO[]>> {
  return instance.get(`${BASE}/list`, { params })
}

export function getPromoterCouponById(id: number): Promise<ApiResponse<PromoterCouponVO>> {
  return instance.get(`${BASE}/by-id`, { params: { id } })
}

export function createPromoterCoupon(dto: PromoterCouponCreateDTO): Promise<ApiResponse<PromoterCouponVO>> {
  return instance.post(`${BASE}/create`, dto)
}

export function updatePromoterCoupon(dto: PromoterCouponUpdateDTO): Promise<ApiResponse<PromoterCouponVO>> {
  return instance.post(`${BASE}/update`, dto)
}

export function deletePromoterCoupon(id: number): Promise<ApiResponse<void>> {
  return instance.post(`${BASE}/delete`, null, { params: { id } })
}

export function generateCouponCode(length = 4): Promise<ApiResponse<string>> {
  return instance.get(`${BASE}/generate-code`, { params: { length } })
}
