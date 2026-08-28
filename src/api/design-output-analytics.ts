import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface DesignOutputStats {
  startDate: string
  endDate: string
  createdDesigns: number
  submittedDesigns: number
  approvedDesigns: number
  launchedDesigns: number
  estimatedHistory: boolean
}

export const getDesignOutputStats = (params: { startDate: string; endDate: string }): Promise<ApiResponse<DesignOutputStats>> =>
  instance.get('/admin/analytics/design-output', { params })
