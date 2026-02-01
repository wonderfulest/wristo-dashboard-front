export interface SearchRecordVO {
  id: number
  keyword: string
  userId: number
  deviceId: number
  ip: string
  userAgent: string
  resultCount: number
  createdAt: string
}

export interface SearchRecordPageRequest {
  pageNum: number
  pageSize: number
  orderBy?: string
  populate?: string
  keyword?: string | null
  userId?: number | null
  deviceId?: number | null
  ip?: string | null
}
