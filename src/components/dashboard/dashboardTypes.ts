export interface DashboardFilter {
  rangeType: 'today' | 'yesterday' | 'dayBeforeYesterday' | '3d' | '7d' | '30d' | 'custom'
  startDate: string
  endDate: string
  appId: number | null
}
