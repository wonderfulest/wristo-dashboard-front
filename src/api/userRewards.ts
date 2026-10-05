import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface UserRewardSettings {
  checkInEnabled: boolean
  checkInCredits: number
  purchaseEnabled: boolean
  purchaseCredits: number
  downloadEnabled: boolean
  downloadCredits: number
  downloadDailyLimit: number
}
export const getUserRewards = (): Promise<ApiResponse<UserRewardSettings>> => instance.get('/admin/user-rewards')
export const saveUserRewards = (settings: UserRewardSettings): Promise<ApiResponse<UserRewardSettings>> => instance.put('/admin/user-rewards', settings)
