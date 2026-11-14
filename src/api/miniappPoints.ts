import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface PointsSettings { defaultPoints: number }
export interface AppPointsSettings { enabled: boolean; points: number | null; effectivePoints: number; itemId: number | null }
export const getPointsSettings = (): Promise<ApiResponse<PointsSettings>> => instance.get('/admin/miniapp-points/settings')
export const savePointsSettings = (data: PointsSettings): Promise<ApiResponse<PointsSettings>> => instance.put('/admin/miniapp-points/settings', data)
export const getAppPoints = (id: number): Promise<ApiResponse<AppPointsSettings>> => instance.get(`/admin/miniapp-points/apps/${id}`)
export const saveAppPoints = (id: number, data: Pick<AppPointsSettings, 'enabled' | 'points'>): Promise<ApiResponse<AppPointsSettings>> => instance.put(`/admin/miniapp-points/apps/${id}`, data)
export interface PointsRewards {
  checkInPoints: number
  loginPoints: number
  tutorialPoints: number
  dailyInstallPoints: number
  firstInstallPoints: number
  weeklyInstallPoints: number
  weeklyCheckIn3Points: number
  weeklyCheckIn5Points: number
  weeklyCheckInFullPoints: number
  weeklyInstallFullPoints: number
  adPoints: number
}
export interface PointsResource { id: number; name: string; points: number; enabled: boolean }
export const getPointsRewards = (): Promise<ApiResponse<PointsRewards>> => instance.get('/admin/miniapp-points/rewards')
export const savePointsRewards = (data: PointsRewards): Promise<ApiResponse<PointsRewards>> => instance.put('/admin/miniapp-points/rewards', data)
export const getPointsResources = (): Promise<ApiResponse<PointsResource[]>> => instance.get('/admin/miniapp-points/resources')
export const savePointsResource = (id: number, points: number): Promise<ApiResponse<PointsResource>> => instance.put(`/admin/miniapp-points/resources/${id}`, { points })
