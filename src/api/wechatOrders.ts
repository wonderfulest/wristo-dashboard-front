import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface WechatOrder {
  orderNo: string
  userId: number
  planCode: string
  name: string
  durationDays: number
  amountFen: number
  status: string
  transactionId: string | null
  subscriptionId: number | null
  paidAt: string | null
  createdAt: string
  expiresAt: string
}
export interface WechatOrderQuery {
  pageNum: number
  pageSize: number
  orderNo?: string
  userId?: number
  status?: string
  createdFrom?: string
  createdTo?: string
}
export const getWechatOrders = (query: WechatOrderQuery, source: 'DOMESTIC' | 'LEGACY' = 'DOMESTIC'): Promise<ApiResponse<{
  records: WechatOrder[]; total: number; pageNum: number; pageSize: number
}>> => instance.post('/admin/orders/wechat/page', query, { params: { source } })
