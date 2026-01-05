import request from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'

export interface Trial {
  id: number
  appId: number
  bundleId: number
  accountToken: string
  platform: string
  device: string
  isTest: boolean
  skipTrial: boolean
  libv: string
  partNumber: string
  paymentCode: string
  email: string
  purchaseRecordId: number
  status: number
  createdAt: string
  updatedAt: string
  version: number
}

export interface TrialPageQueryDTO {
  pageNum: number
  pageSize: number
  orderBy?: string
  appId?: number
  bundleId?: number
  email?: string
  device?: string
  status?: number
}

export const getTrialById = (id: number): Promise<ApiResponse<Trial>> => {
  return request.get(`/admin/trials/${id}`)
}

export const getTrialPage = (
  data: TrialPageQueryDTO
): Promise<ApiResponse<PageResponse<Trial>>> => {
  return request.post('/admin/trials/page', data)
}

export const backupTrialMonth = (month: string): Promise<ApiResponse<any>> => {
  return request.post('/admin/trials/backup-month', null, {
    params: { month }
  })
}

export const cleanupOldTrials = (month: string): Promise<ApiResponse<number>> => {
  return request.post('/admin/trials/cleanup-old', null, {
    params: { month }
  })
}
