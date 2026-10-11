import api from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface UtilityConfig {
  appKey: string; revision: number; name: string; nameZh: string; summary: string; summaryZh: string
  description: string; descriptionZh: string; instructions: string; instructionsZh: string
  logoUrl: string; coverUrl: string; heroUrl: string; shareUrls: string[]; downloadUrl: string
  websiteVisible: boolean; enabled: boolean; sortOrder: number
  installationCount: number; boundInstallationCount: number; boundUserCount: number
}
export const getUtilityConfigs = (): Promise<ApiResponse<UtilityConfig[]>> => api.get('/admin/utilities')
export const saveUtilityConfig = (value: UtilityConfig): Promise<ApiResponse<UtilityConfig>> => {
  const { appKey, installationCount, boundInstallationCount, boundUserCount, ...body } = value
  return api.put(`/admin/utilities/${encodeURIComponent(appKey)}`, body)
}
