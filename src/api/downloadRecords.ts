import request from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'

export interface DownloadRecord {
  id: number
  appId: number
  appName?: string
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
}

export interface DownloadRecordQuery {
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
