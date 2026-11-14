import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface RewardAccount { userId: number; balance: number; debt: number; available: number }
export interface RewardEntry { id: string; eventKey: string; delta: number; description: string; createdAt: string }
export interface RewardAdjustment { delta: number; reason: string; idempotencyKey: string }
export const getRewardAccount = (id: number): Promise<ApiResponse<RewardAccount>> => instance.get(`/admin/reward-points/${id}`)
export const getRewardHistory = (id: number, page: number): Promise<ApiResponse<{items: RewardEntry[]; total: number}>> => instance.get(`/admin/reward-points/${id}/history`, { params: { page, pageSize: 20 } })
export const adjustRewardPoints = (id: number, body: RewardAdjustment): Promise<ApiResponse<RewardAccount>> => instance.post(`/admin/reward-points/${id}/adjustments`, body)
