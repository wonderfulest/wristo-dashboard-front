import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type {
  AnalyticsQuery,
  AnalyticsResponse,
  CategoryValue,
  CohortContribution,
  DesignerValue,
  LaunchRecommendation, LaunchOperationsRecommendation,
  LifecycleCurve,
  LaunchSalesInsights,
} from '@/types/launch-analytics'

const BASE = '/admin/analytics/launch'

export interface AnalyticsTrainingStatus {
  accepted: boolean
  running: boolean
  status: 'IDLE' | 'TRAINING' | 'SUCCESS' | 'FAILED'
  modelVersion?: string | null
  failureReason?: string | null
}

const get = <T>(path: string, params: AnalyticsQuery = {}): Promise<ApiResponse<AnalyticsResponse<T>>> =>
  instance.get(`${BASE}${path}`, { params: { timezone: 'UTC', ...params } })

export const getLaunchRecommendation = (params?: AnalyticsQuery) =>
  get<LaunchOperationsRecommendation>('/recommendation', params)

export const getLaunchContributions = (params?: AnalyticsQuery) =>
  get<Record<string, CohortContribution>>('/contributions', params)

export const getLaunchLifecycle = (params?: AnalyticsQuery) =>
  get<LifecycleCurve>('/lifecycle', params)

export const getLaunchMarginalRevenue = (params?: AnalyticsQuery) =>
  get<LaunchRecommendation>('/marginal-revenue', params)

export const getLaunchSalesInsights = (params?: AnalyticsQuery) =>
  get<LaunchSalesInsights>('/sales-insights', params)

export const getCategoryValues = (params?: AnalyticsQuery) =>
  get<CategoryValue[]>('/categories', params)

export const getDesignerValues = (params?: AnalyticsQuery) =>
  get<DesignerValue[]>('/designers', params)

export const trainLaunchAnalytics = (): Promise<ApiResponse<AnalyticsTrainingStatus>> =>
  instance.post(`${BASE}/train`)

export const getLaunchAnalyticsTrainingStatus = (): Promise<ApiResponse<AnalyticsTrainingStatus>> =>
  instance.get(`${BASE}/train/status`)
