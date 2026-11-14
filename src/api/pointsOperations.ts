import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { BusinessReference } from '@/api/pointsReferences'
export interface OperationsQuery {
  from: string; to: string; page: number; pageSize: number
  userId?: string; keyword?: string; asset?: 'REWARD' | 'AI'; type?: string; direction?: 'IN' | 'OUT' | 'ZERO'
  eventKey?: string; id?: string; source?: 'MINIAPP' | 'CN_BRIDGE'; kind?: 'WATCHFACE' | 'RESOURCE'
}
export interface OperationsPage<T> { items: T[]; total: number; page: number; pageSize: number; from: string; to: string; timezone: string }
export interface LedgerEntry {
  id: string; ledgerId: string; asset: 'REWARD' | 'AI'; userId: string; username: string | null; email: string | null
  eventKey: string; type: string; delta: number; balanceAfter: number | null; description: string; reason: string | null
  operatorId: string | null; operatorName: string | null; createdAt: string; references: BusinessReference[]
}
export interface RedemptionEntry {
  id: string; source: 'MINIAPP' | 'CN_BRIDGE'; userId: string; username: string | null; email: string | null
  kind: 'WATCHFACE' | 'RESOURCE'; name: string; points: number; appId: string | null; createdAt: string
  status: 'COMPLETED' | 'DEBIT_RECORDED'; detailAvailable: boolean; eventKey: string; references: BusinessReference[]
}
export const getPointsLedger = (params: OperationsQuery): Promise<ApiResponse<OperationsPage<LedgerEntry>>> => instance.get('/admin/points-operations/ledger', { params })
export const getPointsRedemptions = (params: OperationsQuery): Promise<ApiResponse<OperationsPage<RedemptionEntry>>> => instance.get('/admin/points-operations/redemptions', { params })
