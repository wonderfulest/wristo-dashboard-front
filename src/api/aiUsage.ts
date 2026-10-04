import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface UsageFilter { userId?: number; provider?: string; model?: string; scene?: string; from?: string; to?: string }
export interface UsageRow {
  id?: string; user_id?: string; username?: string; email?: string; provider?: string; model?: string; scene?: string
  status?: string; created_at?: string; pricing_version?: string; request_id?: string
  cost_currency?: string; cost_status?: string; estimated_cost?: number | null
  calls?: number; input_tokens?: number | null; output_tokens?: number | null; cached_input_tokens?: number | null
  total_tokens?: number | null; image_count?: number | null; succeeded_calls?: number; failed_calls?: number; pending_calls?: number
  unknown_token_calls?: number; unpriced_calls?: number; unknown_cost_calls?: number
}
export interface UsagePage { items: UsageRow[]; total: number; page: number; pageSize: number }
export interface UsageOverview { totals: UsageRow; currencies: { cost_currency: string; estimated_cost: number; priced_calls: number }[] }
export interface PriceDraft {
  provider: 'OPENAI' | 'BAILIAN'; model: string; currency: 'USD' | 'CNY'; sourceUrl: string; effectiveAt: string | null
  rules: { mode: 'TOKENS' | 'IMAGE'; input: number | null; output: number | null; image: number | null }
}
export interface PriceVersion extends PriceDraft { id: string; createdAt: string; createdBy: string }
export const getUsageOverview = (params: UsageFilter): Promise<ApiResponse<UsageOverview>> => instance.get('/admin/studio-ai/usage/overview', { params })
export const getUsageReport = (params: UsageFilter & { group: string; page: number; pageSize: number }): Promise<ApiResponse<UsagePage>> => instance.get('/admin/studio-ai/usage/report', { params })
export const getAiPrices = (): Promise<ApiResponse<PriceVersion[]>> => instance.get('/admin/studio-ai/prices')
export const getAiPrice = (id: string): Promise<ApiResponse<PriceVersion>> => instance.get(`/admin/studio-ai/prices/${encodeURIComponent(id)}`)
export const createAiPrice = (data: PriceDraft): Promise<ApiResponse<PriceVersion>> => instance.post('/admin/studio-ai/prices', data)
