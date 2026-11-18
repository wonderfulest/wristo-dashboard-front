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

export type LookReviewType = 'posts' | 'comments'
export type LookReviewState = 'all' | 'pending' | 'visible' | 'rejected' | 'unlisted' | 'hidden' | 'deleted'
export type LookReviewMethod = 'all' | 'auto' | 'manual'
export interface LookReview {
  id: number
  user_id: number
  author_name?: string
  created_at: string
  state: string
  submission_version?: string
  reviewed_by?: number | null
  reviewed_at?: string | null
  review_reason?: string | null
  caption?: string
  device_name?: string
  app_id?: number
  media_id?: string
  media_type?: string
  image_url?: string
  video_url?: string
  post_id?: number
  body?: string
  parent_id?: number | null
  parent_body?: string | null
  post_state?: string
  post_caption?: string
}
export interface ReviewPage { items: LookReview[]; hasMore: boolean; page: number }
export function listLookReviews(type: LookReviewType, state: LookReviewState, page: number, method: LookReviewMethod = 'all', publisherId?: number, appId?: number): Promise<ApiResponse<ReviewPage>> {
  return instance.get('/admin/looks/reviews', { params: { type, state, method, publisherId, appId, page, pageSize: 20 } })
}
export function getLookReview(type: LookReviewType, id: number): Promise<ApiResponse<LookReview>> {
  return instance.get(`/admin/looks/reviews/${type}/${id}`)
}
export function decideLookReview(type: LookReviewType, id: number, approved: boolean, reason: string, submissionVersion?: string): Promise<ApiResponse<boolean>> {
  return instance.put(`/admin/looks/reviews/${type}/${id}`, { approved, reason, submissionVersion })
}
export function getLookReviewMedia(mediaId: string, thumbnail: boolean, signal: AbortSignal): Promise<Blob> {
  return instance.get(`/admin/looks/media/${mediaId}`, { params: { thumbnail }, responseType: 'blob', signal })
}

export function changeLookVisibility(type: LookReviewType, id: number, current: string, target: string): Promise<ApiResponse<boolean>> {
  return instance.put(`/admin/looks/reviews/${type}/${id}/visibility`, { current, target })
}

export function getLookAutoReview(): Promise<ApiResponse<{ enabled: boolean }>> {
  return instance.get('/admin/looks/auto-review')
}
export function saveLookAutoReview(enabled: boolean): Promise<ApiResponse<{ enabled: boolean }>> {
  return instance.put('/admin/looks/auto-review', { enabled })
}
