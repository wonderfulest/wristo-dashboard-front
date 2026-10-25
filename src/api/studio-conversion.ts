import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface ConversionStep { key: string; visitors: number; previousRate: number | null; overallRate: number | null; lost: number }
export interface ConversionBreakdown { key: string; visitors: number; entered: number; saved: number; apps: number; built: number }
export interface StudioConversionReport {
  timezone: string; conversionWindowDays: number; steps: ConversionStep[]
  sources: ConversionBreakdown[]; daily: ConversionBreakdown[]; devices: ConversionBreakdown[]
  retentionEligible: number; returned: number; returnRate: number | null; pendingRetention: number
  trackingStartedAt: string | null
}
export const getStudioConversion = (startDate: string, endDate: string): Promise<ApiResponse<StudioConversionReport>> =>
  instance.get('/admin/analytics/studio-conversion', { params: { startDate, endDate } })
