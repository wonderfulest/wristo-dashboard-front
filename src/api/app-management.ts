import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { CnBackfillPage } from '@/utils/cnCatalogBackfill'

export interface CnCatalogStatus {
  enabled: boolean
  configured: boolean
  tracked: number
  pending: number
  retrying: number
  oldestPendingAt: string | null
  lastDeliveredAt: string | null
}

export const getCnCatalogStatus = (): Promise<ApiResponse<CnCatalogStatus>> =>
  instance.get('/admin/catalog-cn/status')

export const submitCnCatalogPage = (afterAppId: number): Promise<ApiResponse<CnBackfillPage>> =>
  instance.post('/admin/catalog-cn/backfill', null, { params: { afterAppId, limit: 200 } })

// 全量统计耗时随应用数量增长；请求失败时不能推断服务端任务已经停止。
export const refreshDownloads = (): Promise<ApiResponse<boolean>> =>
  instance.post('/admin/products/stats/downloads/refresh', null, { timeout: 30 * 60 * 1000 })

export const refreshPurchases = (): Promise<ApiResponse<boolean>> =>
  instance.post('/admin/products/stats/purchases/refresh', null, { timeout: 30 * 60 * 1000 })
