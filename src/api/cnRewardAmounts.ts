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
export interface CnRewardAmountsView { settings: CnRewardAmounts; version: number; initialized: boolean }
export const getCnRewardAmounts = (): Promise<ApiResponse<CnRewardAmountsView>> => instance.get('/admin/cn-reward-amounts')
export const saveCnRewardAmounts = (data: CnRewardAmounts, version: number): Promise<ApiResponse<CnRewardAmountsView>> => instance.put('/admin/cn-reward-amounts', data, { headers: { 'X-Config-Version': version } })
