import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface CreatorRewardSettings {
  downloadEnabled: boolean
  downloadsPerReward: number
  downloadCredits: number
  purchaseEnabled: boolean
  purchaseCredits: number
}
export interface CreatorRewardView {
  settings: CreatorRewardSettings
  settlement: { startedAt: string; lastSettledDay: string | null }
  job: { running: boolean; status: string; failure: string | null }
}
export const getCreatorRewards = (): Promise<ApiResponse<CreatorRewardView>> => instance.get('/admin/creator-rewards')
export const saveCreatorRewards = (settings: CreatorRewardSettings): Promise<ApiResponse<CreatorRewardView>> => instance.put('/admin/creator-rewards', settings)
