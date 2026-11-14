import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export type BusinessReferenceKind = 'AI_CALL' | 'CREDIT_PURCHASE' | 'REDEMPTION' | 'SOCIAL_SHARE' | 'APP'
export type BusinessDetailKind = Exclude<BusinessReferenceKind, 'APP'>
export interface BusinessReference { kind: BusinessReferenceKind; id: string; label: string }
export interface BusinessReferenceField { key: string; label: string; value: string | null; format: 'text' | 'datetime' }
export interface BusinessReferenceDetail {
  kind: BusinessDetailKind
  id: string
  userId: string
  title: string
  fields: BusinessReferenceField[]
}
export const getPointsBusinessReference = (kind: BusinessDetailKind, id: string, userId: string): Promise<ApiResponse<BusinessReferenceDetail>> =>
  instance.get(`/admin/points-operations/references/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, { params: { userId } })
