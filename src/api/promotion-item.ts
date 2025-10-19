import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { PromotionItemVO, PromotionItemDTO } from '@/types/promotion'

const BASE = '/admin/promotion/item'

export const listCampaignItems = (campaignId: number): Promise<ApiResponse<PromotionItemVO[]>> => {
  return instance.get(`${BASE}/list/${campaignId}`)
}

export const replaceCampaignItems = (campaignId: number, items: PromotionItemDTO[]): Promise<ApiResponse<void>> => {
  return instance.post(`${BASE}/replace/${campaignId}`, items)
}
