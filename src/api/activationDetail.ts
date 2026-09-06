import request from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface ActivationDeviceDetail {
  deviceKey: string | null
  deviceName: string | null
  activationCount: number
  appCount: number
  historicalCount: number
  firstActivatedAt: string | null
  lastActivatedAt: string | null
}
export interface ActivationTimelineItem {
  trialId: number
  appId: number | null
  appName: string | null
  appImageUrl: string | null
  appUrl: string | null
  deviceKey: string | null
  deviceName: string | null
  partNumber: string | null
  source: string
  channel: string
  activatedAt: string | null
  countryCode: string | null
  countryName: string | null
  region: string | null
  city: string | null
  locationSource: string | null
  locationCapturedAt: string | null
  purchaseCountryCode: string | null
}
export interface ActivationDetail {
  email: string
  timezone: string
  summary: {
    activationCount: number; appCount: number; deviceCount: number; historicalCount: number
    firstActivatedAt: string | null; lastActivatedAt: string | null
  }
  devices: ActivationDeviceDetail[]
  items: ActivationTimelineItem[]
  total: number
  page: number
  pageSize: number
  historical: boolean
}
export interface ActivationDetailQuery {
  email: string
  startDate?: string
  endDate?: string
  historical: boolean
  page: number
  pageSize: number
}
export const getActivationDetail = (params: ActivationDetailQuery): Promise<ApiResponse<ActivationDetail>> =>
  request.get('/admin/analytics/activations/user', { params })
