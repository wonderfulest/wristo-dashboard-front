import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { GlobalConfigHistory } from '@/types/ops'

export interface VersionComponent { version: string; image?: string }
export interface PlatformVersions {
  schemaVersion: number
  configVersion: number
  connectIqTools: VersionComponent
  connectIqAppBuild: VersionComponent
  superAlpha: VersionComponent
  superBarrel: VersionComponent
  studio: VersionComponent
  wristoApi: VersionComponent
  updatedBy?: string
  updatedAt?: string
}

export interface PlatformVersionUpdate {
  configVersion: number
  connectIqTools: string
  connectIqAppBuild: string
  superAlpha: string
  superBarrel: string
  studio: string
  wristoApi: string
}

export const getPlatformVersions = (): Promise<ApiResponse<PlatformVersions>> =>
  instance.get('/admin/platform-versions')

export const updatePlatformVersions = (data: PlatformVersionUpdate): Promise<ApiResponse<PlatformVersions>> =>
  instance.request({ url: '/admin/platform-versions', method: 'put', data })

export const getPlatformVersionHistory = (): Promise<ApiResponse<GlobalConfigHistory[]>> =>
  instance.get('/admin/platform-versions/history')
