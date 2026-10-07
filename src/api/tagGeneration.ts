import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface Thresholds { minDownloads: number; minPurchases: number }
export interface Candidate { appId: string; name: string; rawImageUrl: string; download: number; purchase: number }
export interface Quote { model: string; provider: 'BAILIAN' }
export interface BatchRequest extends Thresholds { requestId: string; appIds: string[]; expectedModel: string }
export interface BatchJob { id: string; status: string; model: string; total: number; completed: number; failed: number; skipped: number; createdAt: string; providerBatchId?: string; items: { appId: string; status: string }[] }
export const getCandidates = (params: Thresholds & { pageNum: number; pageSize: number }): Promise<ApiResponse<{ list: Candidate[]; total: number; pages: number }>> => instance.get('/admin/product-tags/generation/candidates', { params })
export const getQuote = (): Promise<ApiResponse<Quote>> => instance.get('/admin/product-tags/generation/quote')
export const submitBatch = (data: BatchRequest): Promise<ApiResponse<BatchJob>> => instance.post('/admin/product-tags/generation/batches', data, { timeout: 65000 })
export const getBatches = (): Promise<ApiResponse<BatchJob[]>> => instance.get('/admin/product-tags/generation/batches')
export const refreshBatch = (id: string): Promise<ApiResponse<BatchJob>> => instance.post(`/admin/product-tags/generation/batches/${encodeURIComponent(id)}/refresh`, undefined, { timeout: 65000 })
