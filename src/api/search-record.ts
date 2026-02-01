import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { SearchRecordVO, SearchRecordPageRequest } from '@/types/search-record'

const BASE = '/admin/products/search-record'

export function fetchSearchRecordPage(
  dto: SearchRecordPageRequest
): Promise<ApiResponse<PageResponse<SearchRecordVO>>> {
  return instance.post(`${BASE}/page`, dto)
}

export function getSearchRecordById(id: number): Promise<ApiResponse<SearchRecordVO>> {
  return instance.get(`${BASE}/${id}`)
}
