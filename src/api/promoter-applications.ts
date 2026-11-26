import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface PromoterApplication {
  id: number
  userId: number
  email: string
  status: ReviewStatus
  reason: string | null
  applicationReason: string | null
  createdAt: string
}

const base = '/admin/promotion/applications'

export function getApplications(page: number, size: number, status: ReviewStatus):
  Promise<ApiResponse<{ records: PromoterApplication[], total: number }>> {
  return instance.get(base, { params: { page, size, status } })
}

export function reviewApplication(id: number, approved: boolean, reason: string): Promise<ApiResponse<unknown>> {
  return instance.post(base + '/' + id + '/review', { approved, reason })
}
