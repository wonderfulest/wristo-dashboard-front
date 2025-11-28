import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { FetchDesignReviewPageParams, Design } from '@/types/design'

// 获取设计审核列表
export function fetchDesignReviewPage(params: FetchDesignReviewPageParams): Promise<ApiResponse<PageResponse<Design>>> {
  return instance.get('/admin/design/page/review', { params })
}

// 审核通过
export function approveDesign(designUid: string): Promise<ApiResponse<boolean>> {
  return instance.post(`/admin/design/approve/${designUid}`)
}

// 批量审核通过
export function approveDesignBatch(designUids: string[]): Promise<ApiResponse<boolean>> {
  return instance.post('/admin/design/approveBatch', designUids)
}

// 审核不通过（带审核意见）
export interface DesignRejectDTO {
  designUid: string
  reviewComment: string
}

export function rejectDesignWithComment(dto: DesignRejectDTO): Promise<ApiResponse<boolean>> {
  return instance.post('/admin/design/reject', dto)
}