import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface CreditAdjustment { requestId: string; direction: 'ADD' | 'REMOVE'; amount: number; reason: string; note: string }
export interface CreditEntry { id: string; type: string; delta: number; balance_after: number; reason?: string; note?: string; operator_id?: string; operator_name?: string; created_at: string }
export const getCreditAccount = (userId: number): Promise<ApiResponse<{ balance: number }>> => instance.get(`/admin/studio-ai/credits/${userId}`)
export const getCreditHistory = (userId: number, page: number): Promise<ApiResponse<{ items: CreditEntry[]; total: number }>> => instance.get(`/admin/studio-ai/credits/${userId}/history`, { params: { page, pageSize: 20 } })
export const adjustCredits = (userId: number, data: CreditAdjustment): Promise<ApiResponse<{ balance: number }>> => instance.post(`/admin/studio-ai/credits/${userId}/adjustments`, data)
