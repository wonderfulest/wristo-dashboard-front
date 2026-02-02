export interface ProductKeywordScoreVO {
  id: number
  productKeyword: string
  searchTimes: number
  userCnt: number
  avgResults: number
  zeroResultTimes: number
  productScore: number
  statDate: string
  createdTime: string
}

export interface ProductKeywordScorePageRequest {
  pageNum: number
  pageSize: number
  orderBy?: string
  populate?: string
  keyword?: string | null
  statDate?: string | null
  minScore?: number | null
  suggestion?: string | null
}
