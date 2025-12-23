import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { CampaignPushVO, CampaignPushCreateDTO, CampaignPushUpdateDTO, CampaignPushPageQuery } from '@/types/promotion'

const BASE = '/admin/campaign/push'

export const createCampaignPush = (data: CampaignPushCreateDTO): Promise<ApiResponse<CampaignPushVO>> => {
  return instance.post(`${BASE}/create`, data)
}

export const updateCampaignPush = (id: number, data: CampaignPushUpdateDTO): Promise<ApiResponse<CampaignPushVO>> => {
  return instance.post(`${BASE}/update/${id}`, data)
}

export const getCampaignPush = (id: number): Promise<ApiResponse<CampaignPushVO>> => {
  return instance.get(`${BASE}/${id}`)
}

export const deleteCampaignPush = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`${BASE}/delete/${id}`)
}

export const getCampaignPushPage = (params: CampaignPushPageQuery): Promise<ApiResponse<PageResponse<CampaignPushVO>>> => {
  return instance.post(`${BASE}/page`, params)
}

export const listCampaignPushByCampaignId = (campaignId: number): Promise<ApiResponse<CampaignPushVO[]>> => {
  return instance.get(`${BASE}/list-by-campaign/${campaignId}`)
}

export const listCampaignPushByUserId = (userId: number): Promise<ApiResponse<CampaignPushVO[]>> => {
  return instance.get(`${BASE}/list-by-user/${userId}`)
}

export const deleteCampaignPushByCampaignId = (campaignId: number): Promise<ApiResponse<void>> => {
  return instance.post(`${BASE}/delete/by-campaign`, null, { params: { campaignId } })
}

export const triggerCampaignPushOne = (pushId: number): Promise<ApiResponse<void>> => {
  return instance.post(`${BASE}/trigger/one`, null, { params: { pushId } })
}

export const triggerCampaignPushAll = (campaignId: number, limit: number = -1): Promise<ApiResponse<void>> => {
  return instance.post(`${BASE}/trigger/all`, null, { params: { campaignId, limit } })
}
