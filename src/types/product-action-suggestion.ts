export interface ProductActionSuggestionVO {
  id: number
  productKeyword: string
  productScore: number
  suggestion: string
  statDate: string
  createdTime: string
}

export interface ProductActionSuggestionPageRequest {
  pageNum: number
  pageSize: number
  orderBy?: string
  populate?: string
  keyword?: string | null
  statDate?: string | null
  suggestion?: string | null
  minScore?: number | null
}
