import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface CreditTotals {
  issued: number
  consumed: number
  refunded: number
  restored: number
  recovered: number
  netConsumed: number
  netChange: number
}

export interface CreditDaily {
  date: string
  totals: CreditTotals
  openingBalance: number
  closingBalance: number
  partial: boolean
}

export interface CreditBreakdown {
  type: string
  reason: string | null
  totals: CreditTotals
}

export interface CreditStatistics {
  from: string
  to: string
  timezone: string
  generatedAt: string
  allTime: CreditTotals
  accounts: { available: number; debt: number; netBalance: number; ledgerBalance: number; discrepancy: number }
  period: CreditTotals
  openingBalance: number
  closingBalance: number
  daily: CreditDaily[]
  breakdown: CreditBreakdown[]
}

export const getCreditStatistics = (params: { from?: string; to?: string }): Promise<ApiResponse<CreditStatistics>> =>
  instance.get('/admin/studio-ai/credits/statistics', { params })
