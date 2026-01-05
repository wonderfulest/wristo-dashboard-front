import request from '@/config/axios'

export interface PaddleAdjustmentQuery {
  id?: string
  transaction_id?: string
  customer_id?: string
  page?: number
  per_page?: number
}

export interface PaddleAdjustmentListResponse<T = any> {
  code: number
  msg?: string
  data?: {
    data: T[]
  } | T
}

export interface PaddleRefundRecordVO {
  id: number
  userId?: number
  transactionId: string
  purchaseRecordId?: number
  refundAmount?: string | number
  currencyCode?: string
  refundReason?: string
  adminUserId?: number
  adminUsername?: string
  refundStatus?: number
  createdAt?: string
  updatedAt?: string
}

export interface PaddleAdjustmentWithRefundResponse<T = any> {
  adjustments: PaddleAdjustmentListResponse<T>
  refundRecord: PaddleRefundRecordVO | null
}

export const listPaddleAdjustments = (params: PaddleAdjustmentQuery) => {
  return request.get('/admin/paddle/adjustments', { params })
}

export const getPaddleCreditNotePdf = (id: string) => {
  return request.get(`/admin/paddle/adjustments/${id}/credit-note`)
}
