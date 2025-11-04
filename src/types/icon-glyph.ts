import type { PageQueryDTO, PageResponse, ApiResponse } from './common'

export interface IconGlyphVO {
  id: number
  glyphId?: number
  assetId?: number
  version?: number
  glyphCode?: string
  style?: string
  isDefault?: number
  isActive?: number
  icon?: IconLibrary
  asset?: IconAsset
  // legacy/extra fields kept optional for compatibility
  iconId?: number
  name?: string
  unicode?: string
  alias?: string
  svgPath?: string
  svgContent?: string
  createdAt?: string
  updatedAt?: string
}

export interface IconLibrary {
  id?: number
  iconUnicode?: string
  symbolCode?: string
  category?: string
  label?: string
  isActive?: number
  createdAt?: string
  updatedAt?: string
}

export interface IconAsset {
  id?: number
  iconId?: number
  sourceType?: string
  format?: string
  svgContent?: string
  imageUrl?: string
  previewUrl?: string
  author?: string
  license?: string
  tags?: string
  version?: number
  isActive?: number
  createdAt?: string
  updatedAt?: string
}

export interface IconGlyphCreateDTO {
  glyphCode: string
  style?: string
  isDefault?: number
  isActive?: number
}

export interface IconGlyphUpdateDTO extends Partial<IconGlyphCreateDTO> {
  id: number
}

export interface IconGlyphPageQueryDTO extends PageQueryDTO {
  iconId?: number
  keyword?: string
}

export type IconGlyphPageResp = ApiResponse<PageResponse<IconGlyphVO>>
