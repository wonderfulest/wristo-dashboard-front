import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { FinalSearchKeywordVO, FinalSearchKeywordPageRequest } from '@/types/final-search-keyword'

const BASE = '/admin/products/final-search-keyword'

export function fetchFinalSearchKeywordPage(
  dto: FinalSearchKeywordPageRequest
): Promise<ApiResponse<PageResponse<FinalSearchKeywordVO>>> {
  return instance.post(`${BASE}/page`, dto)
}

export function getFinalSearchKeywordById(id: number): Promise<ApiResponse<FinalSearchKeywordVO>> {
  return instance.get(`${BASE}/${id}`)
}
