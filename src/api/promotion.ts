import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { PromotionCampaignVO, PromotionCampaignCreateDTO, PromotionCampaignUpdateDTO, PromotionCampaignPageQuery } from '@/types/promotion'

// Align to AdminCampaignController
const BASE = '/admin/campaign'

export const createCampaign = (data: PromotionCampaignCreateDTO): Promise<ApiResponse<PromotionCampaignVO>> => {
  return instance.post(`${BASE}/create`, data)
}

export const updateCampaign = (id: number, data: PromotionCampaignUpdateDTO): Promise<ApiResponse<PromotionCampaignVO>> => {
  return instance.post(`${BASE}/update/${id}`, data)
}

export const getCampaign = (id: number): Promise<ApiResponse<PromotionCampaignVO>> => {
  return instance.get(`${BASE}/${id}`)
}

export const deleteCampaign = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`${BASE}/delete/${id}`)
}

export const getCampaignPage = (params: PromotionCampaignPageQuery): Promise<ApiResponse<PageResponse<PromotionCampaignVO>>> => {
  return instance.post(`${BASE}/page`, params)
}

export const getCampaignList = (): Promise<ApiResponse<PromotionCampaignVO[]>> => {
  return instance.get(`${BASE}/list`)
}
