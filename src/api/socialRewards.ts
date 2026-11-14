import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface SocialSettings { enabled: boolean; credits: number; monthlyLimit: number }
export interface SocialScreenshot { id: string; url: string }
export interface SocialSubmission { id: string; revision: number; userId: string; platform: string; shareUrl: string; notes: string; screenshots: SocialScreenshot[]; status: 'PENDING' | 'APPROVED' | 'REJECTED'; credits: number; reviewNote: string; reviewedBy: string | null; createdAt: string; updatedAt: string; reviewedAt: string | null }
export interface SocialPage { items: SocialSubmission[]; total: number; page: number; pageSize: number }
const base = '/admin/social-share-rewards'
export const socialRewardsApi = {
  settings: (): Promise<ApiResponse<SocialSettings>> => instance.get(`${base}/settings`),
  save: (data: SocialSettings): Promise<ApiResponse<SocialSettings>> => instance.put(`${base}/settings`, data),
  list: (page: number, status: string): Promise<ApiResponse<SocialPage>> => instance.get(base, { params: { page, pageSize: 20, status: status || undefined } }),
  review: (id: string, approve: boolean, reason: string, revision: number): Promise<ApiResponse<SocialSubmission>> => instance.post(`${base}/${encodeURIComponent(id)}/review`, { approve, reason, revision }),
}
