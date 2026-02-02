export interface FinalSearchKeywordVO {
  id: number
  searchRecordId: number
  userId: number
  ip: string
  createdAt: string
  normalizedKeyword: string
  resultCount: number
  isFinalKeyword: number
  createdTime: string
}

export interface FinalSearchKeywordPageRequest {
  pageNum: number
  pageSize: number
  orderBy?: string
  populate?: string
  keyword?: string | null
  isFinalKeyword?: number | null
  userId?: number | null
  ip?: string | null
}

export interface SearchKeywordPipelineRunVO {
  affectedRows?: number
  finalKeywordRows?: number
  candidateRows?: number
  scoreRows?: number
  suggestionRows?: number
  message: string
}
