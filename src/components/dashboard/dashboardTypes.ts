export interface DashboardFilter {
  rangeType: '7d' | '30d' | 'custom'
  startDate: string
  endDate: string
  appId: number | null
}
