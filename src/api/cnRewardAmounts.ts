import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface CnRewardAmounts {
  checkInPoints: number
  trialPoints: number
  trialDailyLimit: number
  referralPoints: number
  monthlyCap: number
  defaultRedemptionPoints: number
  productPoints: Record<string, number>
}
export const getCnRewardAmounts = (): Promise<ApiResponse<CnRewardAmounts>> => instance.get('/admin/cn-reward-amounts')
export const saveCnRewardAmounts = (data: CnRewardAmounts): Promise<ApiResponse<CnRewardAmounts>> => instance.put('/admin/cn-reward-amounts', data)
