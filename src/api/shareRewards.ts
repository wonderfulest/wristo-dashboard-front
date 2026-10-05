import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface ShareRewardSettings {
  enabled: boolean
  creditsPerVisit: number
  minimumVisibleSeconds: number
  userDailyCredits: number
  globalDailyCredits: number
  timeZone: string
  startsAt: string | null
  endsAt: string | null
}
export interface ShareRewardView {
  settings: ShareRewardSettings
  identityReady: boolean
  stats: { day: string; visits: number; validVisits: number; rewardedVisits: number; credits: number }
}
export interface ShareVisitEntry {
  ownerId: string
  productId: string | null
  channel: string
  startedAt: string
  completedAt: string | null
  status: string
  credits: number
  rulesJson: string | null
}
export const getShareRewards = (): Promise<ApiResponse<ShareRewardView>> => instance.get('/admin/share-rewards')
export const saveShareRewards = (settings: ShareRewardSettings): Promise<ApiResponse<ShareRewardView>> => instance.put('/admin/share-rewards', settings)
export const getShareVisits = (page: number): Promise<ApiResponse<{ items: ShareVisitEntry[]; total: number }>> => instance.get('/admin/share-rewards/visits', { params: { page, pageSize: 20 } })
