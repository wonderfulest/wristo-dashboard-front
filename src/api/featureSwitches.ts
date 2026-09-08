import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface FeatureSwitch {
  key: string
  name: string
  description: string
  enabled: boolean
  version: number
  reason: string | null
  updatedBy: string
  updatedAt: string
}

export interface FeatureSwitchHistory {
  id: number
  key: string
  oldEnabled: boolean
  newEnabled: boolean
  reason: string | null
  updatedBy: string
  updatedAt: string
}

export const getFeatureSwitches = (): Promise<ApiResponse<FeatureSwitch[]>> =>
  instance.get('/admin/feature-switches')

export const updateFeatureSwitch = (key: string, data: { enabled: boolean; version: number; reason: string }): Promise<ApiResponse<FeatureSwitch>> =>
  instance.request({ url: `/admin/feature-switches/${encodeURIComponent(key)}`, method: 'put', data })

export const getFeatureSwitchHistory = (key: string): Promise<ApiResponse<FeatureSwitchHistory[]>> =>
  instance.get(`/admin/feature-switches/${encodeURIComponent(key)}/history`)
