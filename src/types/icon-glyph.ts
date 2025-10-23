import type { PageQueryDTO, PageResponse, ApiResponse } from './common'

export interface IconGlyphVO {
  id: number
  glyphCode?: string
  style?: string
  isDefault?: number
  isActive?: number
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
