import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { FetchDesignReviewPageParams, Design } from '@/types/design'

// 获取设计审核列表
export function fetchDesignReviewPage(params: FetchDesignReviewPageParams) {
  return instance.get<ApiResponse<PageResponse<Design>>>('/admin/design/page/review', { params })
}

// 审核通过
export function approveDesign(designUid: string) {
  return instance.post<ApiResponse<boolean>>(`/admin/design/approve/${designUid}`)
}

// 审核不通过
export function rejectDesign(designUid: string) {
  return instance.post<ApiResponse<boolean>>(`/admin/design/reject/${designUid}`)
} 