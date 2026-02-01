import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { GaShortLinkVO } from './gaShortLink'

export interface GaClickEventVO {
  id: number
  shortLinkId: number | null
  shortCode: string
  clickedAt: string
  referer: string | null
  userAgent: string | null
  deviceType: string | null
  os: string | null
  browser: string | null
  ip: string | null
  ipHash: string | null
  country: string | null
  region: string | null
  city: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  utmTerm: string | null
  createdAt: string
  // 关联的短链详情（可选）
  shortLink?: GaShortLinkVO | null
}

export interface GaClickEventPageQuery {
  pageNum?: number
  pageSize?: number
  shortLinkId?: number
  shortCode?: string
  deviceType?: string
  country?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  clickedAtStart?: string
  clickedAtEnd?: string
}

export const pageGaClickEvents = (
  query: GaClickEventPageQuery,
  populate?: string
): Promise<ApiResponse<PageResponse<GaClickEventVO>>> => {
  return instance.post('/admin/ga/click-event/page', query, { params: { populate } })
}

export const getGaClickEventDetail = (
  id: number,
  populate?: string
): Promise<ApiResponse<GaClickEventVO>> => {
  return instance.get('/admin/ga/click-event/detail', { params: { id, populate } })
}
