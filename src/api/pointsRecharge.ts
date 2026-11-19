import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface PointsRechargeConfig {
  enabled: boolean
  pointsPerYuan: 10
  plans: { points: number }[]
}
export const getPointsRechargeConfig = (): Promise<ApiResponse<PointsRechargeConfig>> => instance.get('/admin/points-recharge-config')
export const savePointsRechargeConfig = (data: PointsRechargeConfig): Promise<ApiResponse<PointsRechargeConfig>> => instance.put('/admin/points-recharge-config', data)
