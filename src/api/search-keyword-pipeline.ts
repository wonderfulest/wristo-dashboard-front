import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { SearchKeywordPipelineRunVO } from '@/types/final-search-keyword'

const BASE = '/admin/products/search-keyword-pipeline'

export function buildFinalKeyword(): Promise<ApiResponse<SearchKeywordPipelineRunVO>> {
  return instance.post(`${BASE}/build-final-keyword`)
}

export function buildProductKeywordCandidate(): Promise<ApiResponse<SearchKeywordPipelineRunVO>> {
  return instance.post(`${BASE}/build-product-keyword-candidate`)
}

export function buildAllKeywords(): Promise<ApiResponse<SearchKeywordPipelineRunVO>> {
  return instance.post(`${BASE}/build-all`)
}

export function scoreKeywords(): Promise<ApiResponse<SearchKeywordPipelineRunVO>> {
  return instance.post(`${BASE}/score-keywords`)
}

export function buildActionSuggestion(): Promise<ApiResponse<SearchKeywordPipelineRunVO>> {
  return instance.post(`${BASE}/build-action-suggestion`)
}
