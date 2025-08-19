export interface DesignFontVO {
  id: number
  fullName: string
  postscriptName: string
  slug: string
  family: string
  language: string
  type: string
  weight: string
  versionName: string
  glyphCount: number
  isSystem: number
  status: string // Submitted / Approved / Rejected / Pending
  ttf?: number
  ttfFile?: {
    id: number
    url?: string
    name?: string
    size?: number
    ext?: string
  } | null
}

export interface DesignFontPageQueryDTO {
  pageNum: number
  pageSize: number
  orderBy?: string
  // filters
  status?: string
  slug?: string
  name?: string
  userId?: number
  populate?: string
}
