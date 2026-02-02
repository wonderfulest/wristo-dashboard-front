import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { ProductKeywordScoreVO, ProductKeywordScorePageRequest } from '@/types/product-keyword-score'

const BASE = '/admin/products/product-keyword-score'

export function fetchProductKeywordScorePage(
  dto: ProductKeywordScorePageRequest
): Promise<ApiResponse<PageResponse<ProductKeywordScoreVO>>> {
  return instance.post(`${BASE}/page`, dto)
}

export function getProductKeywordScoreById(id: number): Promise<ApiResponse<ProductKeywordScoreVO>> {
  return instance.get(`${BASE}/${id}`)
}
