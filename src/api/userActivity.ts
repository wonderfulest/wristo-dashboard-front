import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface ActivityPlatform {
  key: string
  internal: boolean
  startedAt: string | null
  today: number | null
}
export interface ActivityDay {
  date: string
  total: number | null
  platforms: Record<string, number | null>
}
export interface UserActivityReport {
  timezone: string
  generatedAt: string
  from: string
  to: string
  platform: string | null
  todayTotal: number | null
  platforms: ActivityPlatform[]
  trend: ActivityDay[]
}
export const getUserActivity = (params: { from: string; to: string; platform?: string }): Promise<ApiResponse<UserActivityReport>> =>
  instance.get('/admin/users/activity', { params })
