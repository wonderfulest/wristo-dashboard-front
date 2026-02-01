import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'

export interface GaShortLinkVO {
  id: number
  shortCode: string
  longUrl: string
  name: string
  channel?: string | null
  platform?: string | null
  campaignId?: string | null
  status?: string | null
  totalClicks?: number | null
  uniqueClicks?: number | null
  createdAt: string
  updatedAt: string
}

export interface GaShortLinkCreateDTO {
  shortCode: string
  longUrl: string
  name: string
  channel?: string | null
  platform?: string | null
  campaignId?: string | null
  status?: string | null
}

export interface GaShortLinkUpdateDTO {
  longUrl?: string
  name?: string
  channel?: string | null
  platform?: string | null
  campaignId?: string | null
  status?: string | null
}

export interface GaShortLinkPageQuery {
  pageNum?: number
  pageSize?: number
  campaignId?: number
  channel?: string | null
  status?: string | null
  nameLike?: string | null
  shortCodeLike?: string | null
}

export const createGaShortLink = (data: GaShortLinkCreateDTO): Promise<ApiResponse<GaShortLinkVO>> => {
  return instance.post('/admin/ga/short-link/create', data)
}

export const getGaShortLinkDetail = (id: number, populate?: string): Promise<ApiResponse<GaShortLinkVO>> => {
  return instance.get('/admin/ga/short-link/detail', { params: { id, populate } })
}

export const updateGaShortLink = (id: number, data: GaShortLinkUpdateDTO): Promise<ApiResponse<GaShortLinkVO>> => {
  return instance.post('/admin/ga/short-link/update', data, { params: { id } })
}

export const deleteGaShortLink = (id: number): Promise<ApiResponse<void>> => {
  return instance.post('/admin/ga/short-link/delete', undefined, { params: { id } })
}

export const pageGaShortLinks = (
  query: GaShortLinkPageQuery,
  populate?: string
): Promise<ApiResponse<PageResponse<GaShortLinkVO>>> => {
  return instance.post('/admin/ga/short-link/page', query, { params: { populate } })
}

export const generateGaShortCode = (length = 8): Promise<ApiResponse<string>> => {
  return instance.get('/admin/ga/short-link/generate-code', { params: { length } })
}

export const toggleGaShortLinkStatus = (id: number): Promise<ApiResponse<void>> => {
  return instance.post('/admin/ga/short-link/toggle-status', undefined, { params: { id } })
}
