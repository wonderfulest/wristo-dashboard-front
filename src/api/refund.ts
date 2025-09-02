import request from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'

export interface PurchaseRefundRequest {
  /**
   * 交易ID
   */
  transactionId: string
  /**
   * 退款原因
   */
  refundReason?: string
}

export interface RefundRecordPageQueryDTO {
  /**
   * 页码
   */
  pageNum: number
  /**
   * 页大小
   */
  pageSize: number
  /**
   * 排序
   */
  orderBy?: string
  /**
   * 用户ID
   */
  userId?: number
  /**
   * 交易ID
   */
  transactionId?: string
  /**
   * 退款原因（模糊查询）
   */
  refundReason?: string
  /**
   * 操作管理员用户名
   */
  adminUsername?: string
  /**
   * 退款状态：1=已退款
   */
  refundStatus?: number
  /**
   * 开始时间（退款时间）
   */
  startTime?: string
  /**
   * 结束时间（退款时间）
   */
  endTime?: string
}

export interface RefundRecordVO {
  /**
   * 主键ID
   */
  id: number
  /**
   * 交易ID
   */
  transactionId: string
  /**
   * 退款原因
   */
  refundReason?: string
  /**
   * 操作管理员用户名
   */
  adminUsername?: string
  /**
   * 退款状态：1=已退款
   */
  refundStatus: number
  /**
   * 退款时间
   */
  refundTime?: string
  /**
   * 创建时间
   */
  createdAt: string
  /**
   * 更新时间
   */
  updatedAt: string
  /**
   * 购买记录信息
   */
  purchaseRecord?: any
}

/**
 * 管理员-退款
 */
export const refundPurchase = (data: PurchaseRefundRequest): Promise<ApiResponse<boolean>> => {
  return request.post('/admin/purchases/refund', data)
}

/**
 * 管理员-退款记录分页查询
 */
export const getRefundRecordsPage = (data: RefundRecordPageQueryDTO): Promise<ApiResponse<PageResponse<RefundRecordVO>>> => {
  return request.post('/admin/purchases/refund-records/page', data)
}
