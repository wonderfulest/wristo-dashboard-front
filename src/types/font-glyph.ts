import type { UserBase } from './user'

export interface FileVO {
  id: number
  name: string
  url: string
  previewUrl?: string
  provider?: string
}

export interface FontGlyphVO {
  id: number
  glyphCode: string
  style?: string
  isDefault?: number
  status?: string
  version?: number
  isActive?: number
  fontType?: string
  userId?: number
  fontFileId?: number
  fontFile?: FileVO
  user?: UserBase
}

export interface FontGlyphPageQueryDTO {
  pageNum: number
  pageSize: number
  active?: number
  isDefault?: number
  keyword?: string
  orderBy?: string
  fontType?: string
}
