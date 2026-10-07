import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { OverviewFilters } from '@/components/users/userOverview.mjs'

export interface UserOverviewItem {
  key: string
  label: string
  count: number
  filters: OverviewFilters
}
export interface UserGrowthRow {
  from: string
  to: string
  count: number
  filters: OverviewFilters
}
export interface UserOverview {
  timezone: string
  generatedAt: string
  from: string
  to: string
  granularity: 'day' | 'week' | 'month'
  source: string | null
  metrics: UserOverviewItem[]
  sources: UserOverviewItem[]
  methods: UserOverviewItem[]
  roles: UserOverviewItem[]
  accounts: UserOverviewItem[]
  trend: UserGrowthRow[]
}
export const getUserOverview = (params: { from: string; to: string; granularity: string; source?: string }): Promise<ApiResponse<UserOverview>> =>
  instance.get('/admin/users/overview', { params })
