export interface DesignFontVO {
  id: number
  fullName: string
  postscriptName: string
  slug: string
  family: string
  subfamily?: string
  language: string
  type: string
  weight: string
  italic?: number // 0/1
  weightClass?: number
  widthClass?: number
  versionName: string
  glyphCount: number
  copyright?: string
  isSystem: number
  isMonospace?: number // 0/1
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
