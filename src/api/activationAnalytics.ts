import request from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface ActivationDaily {
  date: string
  totalCount: number
  codeCount: number
  codeAppCount: number
  directPurchaseCount: number
  existingBundleCount: number
  existingAppCount: number
  giftCount: number
  subscriptionCount: number
  unknownCount: number
}

export interface ActivationRanking {
  email: string
  activationCount: number
  appCount: number
  deviceCount: number
  historicalCount: number
}

export interface ActivationPercentile {
  targetPercent: number
  threshold: number
  userCount: number
  actualPercent: number
}
export interface ActivationAnalytics {
  activationUserCount: number
  deviceUserCount: number
  appDistribution: ActivationPercentile[]
  activationDistribution: ActivationPercentile[]
  timezone: string
  startDate: string
  endDate: string
  trackingStartedAt: string | null
  historicalCount: number
  daily: ActivationDaily[]
  activationRanking: ActivationRanking[]
  deviceRanking: ActivationRanking[]
}

export const getActivationAnalytics = (params: {
  startDate: string
  endDate: string
  appId?: number
  activationPage: number
  devicePage: number
  limit: number
  rankingScope: 'all' | 'period'
}): Promise<ApiResponse<ActivationAnalytics>> => request.get('/admin/analytics/activations', { params })
