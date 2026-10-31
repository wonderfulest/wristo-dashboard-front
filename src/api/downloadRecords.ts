import request from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'

export interface DownloadRecord {
  id: number
  appId: number
  appName?: string
  appAuthorName?: string | null
  appImageUrl?: string | null
  garminStoreUrl?: string | null
  appCreatedAt?: string | null
  appUpdatedAt?: string | null
  appDownloadCount?: number | null
  appPurchaseCount?: number | null
  device?: string
  deviceDisplayName?: string | null
  platform?: string
  email?: string
  status: number
  isTest: boolean
  createdAt: string
  firstSeenAt: string
  downloadType: 'FIRST' | 'RETURNING'
}

export interface DownloadRecordQuery {
  downloadType?: 'FIRST' | 'RETURNING'
  pageNum: number
  pageSize: number
  appId?: number
  device?: string
  email?: string
  startDate?: string
  endDate?: string
}

export const getDownloadRecords = (query: DownloadRecordQuery): Promise<ApiResponse<PageResponse<DownloadRecord>>> =>
  request.post('/admin/trials/downloads/page', query)
