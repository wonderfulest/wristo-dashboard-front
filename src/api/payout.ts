import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { PayoutVO } from '@/types/payout'

// 获取所有收入结算记录
export const getAllPayouts = (): Promise<ApiResponse<PayoutVO[]>> => {
  return instance.get('/admin/payout/list?populate=user')
}

// 分页获取收入结算记录（支持排序：total_income_to_date/current_balance; order: asc/desc）
export interface PayoutPageQueryDTO {
  pageNum: number
  pageSize: number
  orderBy?: string
  // 支持用户名搜索（后端可按需扩展）
  username?: string
}

export const pagePayouts = (
  dto: PayoutPageQueryDTO
): Promise<ApiResponse<PageResponse<PayoutVO>>> => {
  return instance.post('/admin/payout/page?populate=user', dto)
}

// 处理打款（管理员）
export const handlePayoutPaid = (userId: number): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/payout/handle-payout-paid/${userId}`)
}
