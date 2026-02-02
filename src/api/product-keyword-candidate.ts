import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { ProductKeywordCandidateVO, ProductKeywordCandidatePageRequest } from '@/types/product-keyword-candidate'

const BASE = '/admin/products/product-keyword-candidate'

export function fetchProductKeywordCandidatePage(
  dto: ProductKeywordCandidatePageRequest
): Promise<ApiResponse<PageResponse<ProductKeywordCandidateVO>>> {
  return instance.post(`${BASE}/page`, dto)
}

export function getProductKeywordCandidateById(
  id: number
): Promise<ApiResponse<ProductKeywordCandidateVO>> {
  return instance.get(`${BASE}/${id}`)
}
