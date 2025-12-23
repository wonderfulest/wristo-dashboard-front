import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { CampaignVO, CampaignCreateDTO, CampaignUpdateDTO, CampaignPageQuery } from '@/types/promotion'

// Align to AdminCampaignController
const BASE = '/admin/campaign'

export const createCampaign = (data: CampaignCreateDTO): Promise<ApiResponse<CampaignVO>> => {
  return instance.post(`${BASE}/create`, data)
}

export const updateCampaign = (id: number, data: CampaignUpdateDTO): Promise<ApiResponse<CampaignVO>> => {
  return instance.post(`${BASE}/update/${id}`, data)
}

export const getCampaign = (id: number): Promise<ApiResponse<CampaignVO>> => {
  return instance.get(`${BASE}/${id}`)
}

export const deleteCampaign = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`${BASE}/delete/${id}`)
}

export const getCampaignPage = (params: CampaignPageQuery): Promise<ApiResponse<PageResponse<CampaignVO>>> => {
  return instance.post(`${BASE}/page`, params)
}

export const getCampaignList = (): Promise<ApiResponse<CampaignVO[]>> => {
  return instance.get(`${BASE}/list`)
}

export const generatePush = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`${BASE}/generate-push`, null, { params: { id } })
}
