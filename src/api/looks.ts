import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface LookReport {
  id: number
  post_id: number
  comment_id: number | null
  user_id: number
  reporter_name: string | null
  reason: string
  status: 'open' | 'resolved' | 'dismissed'
  created_at: string
  reviewed_by: number | null
  reviewed_at: string | null
  caption?: string
  post_state?: string
  author_id?: number
  author_name?: string
  app_id?: number
  device_name?: string
  image_url?: string
  video_url?: string
  media_type?: string
  comment_body?: string
  comment_state?: string
  comment_author_id?: number
  comment_author_name?: string
}
export interface ReportPage { items: LookReport[]; hasMore: boolean; page: number }
export function listLookReports(page: number, status: string): Promise<ApiResponse<ReportPage>> {
  return instance.get('/admin/looks/reports', { params: { page, pageSize: 20, status: status || undefined } })
}
export function getLookReport(id: number): Promise<ApiResponse<LookReport>> {
  return instance.get(`/admin/looks/reports/${id}`)
}
export function dismissLookReport(id: number): Promise<ApiResponse<boolean>> {
  return instance.put(`/admin/looks/reports/${id}/dismiss`)
}
export function moderateLookReport(report: LookReport): Promise<ApiResponse<boolean>> {
  return report.comment_id != null
    ? instance.delete(`/admin/looks/${report.post_id}/comments/${report.comment_id}`)
    : instance.put(`/admin/looks/${report.post_id}/hide`)
}
