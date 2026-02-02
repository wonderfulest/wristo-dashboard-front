import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { ProductActionSuggestionVO, ProductActionSuggestionPageRequest } from '@/types/product-action-suggestion'

const BASE = '/admin/products/product-action-suggestion'

export function fetchProductActionSuggestionPage(
  dto: ProductActionSuggestionPageRequest
): Promise<ApiResponse<PageResponse<ProductActionSuggestionVO>>> {
  return instance.post(`${BASE}/page`, dto)
}

export function getProductActionSuggestionById(
  id: number
): Promise<ApiResponse<ProductActionSuggestionVO>> {
  return instance.get(`${BASE}/${id}`)
}
