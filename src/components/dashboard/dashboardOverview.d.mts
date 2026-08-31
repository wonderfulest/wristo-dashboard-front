import type { AppFunnelVO, DailySalesItemVO } from '@/types/api'

export interface DashboardRange {
  startDate: string
  endDate: string
  displayPeriod: string
}

export interface DashboardMetrics {
  revenue: number
  orders: number
  downloads: number
  purchaseRate: number | null
}

export function buildDashboardRange(rangeType?: string, now?: Date): DashboardRange
export function buildDesignOutputFilter(now?: Date): import('./dashboardTypes').DashboardFilter
export function calculateBusinessMetrics(sales?: DailySalesItemVO[], funnel?: Partial<AppFunnelVO> | null): DashboardMetrics
export function formatDashboardMetric(key: keyof DashboardMetrics, value: number | null): string
