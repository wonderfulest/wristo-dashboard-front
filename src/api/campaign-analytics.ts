import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface CampaignAnalytics {
  trackingEnabled: boolean
  sesEnabled: boolean
  total: number
  sent: number
  failed: number
  rejected: number
  pending: number
  sending: number
  sesTracked: number
  tracked: number
  delivered: number
  opened: number
  bounced: number
  complained: number
  clicked: number
  channels: Array<{ channel: string; clicks: number; uniqueClicks: number }>
  sesLastEventAt: string | null
  lastEventAt: string | null
}

export const getCampaignAnalytics = (id: number): Promise<ApiResponse<CampaignAnalytics>> => {
  return instance.get(`/admin/campaign/${id}/analytics`)
}
