export interface ProductKeywordCandidateVO {
  id: number
  productKeyword: string
  searchTimes: number
  userCnt: number
  avgResults: number
  zeroResultTimes: number
  firstSeen: string
  lastSeen: string
  statDate: string
}

export interface ProductKeywordCandidatePageRequest {
  pageNum: number
  pageSize: number
  orderBy?: string
  populate?: string
  keyword?: string | null
  statDate?: string | null
}
