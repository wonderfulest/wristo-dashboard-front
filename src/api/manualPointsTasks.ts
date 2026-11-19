import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface ManualTaskConfig { kind: 'REVIEW' | 'SOCIAL'; points: number; enabled: boolean }
export interface ManualSubmission {
  id: string; userId: number; kind: 'REVIEW' | 'SOCIAL'; points: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; link: string; note: string; hasImage: boolean
  reason: string; reviewerId: number | null; createdAt: string; reviewedAt: string | null
}
export interface ManualTaskPage { items: ManualSubmission[]; total: number; page: number }
const base = '/admin/miniapp-points/manual-tasks'
export const getManualTaskConfig = (): Promise<ApiResponse<ManualTaskConfig[]>> => instance.get(`${base}/config`)
export const saveManualTaskConfig = (data: ManualTaskConfig): Promise<ApiResponse<ManualTaskConfig>> => instance.put(`${base}/config`, data)
export const getManualTasks = (page: number, status: string): Promise<ApiResponse<ManualTaskPage>> => instance.get(base, { params: { page, ...(status ? { status } : {}) } })
export const reviewManualTask = (id: string, approve: boolean, reason: string): Promise<ApiResponse<ManualSubmission>> => instance.post(`${base}/review`, { id, approve, reason })
export const getManualTaskEvidence = (id: string): Promise<ApiResponse<{ imageBase64: string }>> => instance.get(`${base}/evidence`, { params: { id } })
