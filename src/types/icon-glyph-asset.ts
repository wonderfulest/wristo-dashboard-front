import type { ApiResponse } from './api'
import type { IconLibraryVO } from './icon-library'
import type { IconAssetVO } from './icon-asset'
import type { PageQueryDTO, PageResponse } from './common'

export interface IconGlyphAssetVO {
  id?: number
  glyphId: number
  assetId?: number
  version?: number
  isActive?: number
  icon?: IconLibraryVO
  asset?: Partial<IconAssetVO> | {}
}

export type IconGlyphAssetsResp = ApiResponse<IconGlyphAssetVO[]>

export interface IconGlyphAssetPageQueryDTO extends PageQueryDTO {
  glyphId?: number
  assetId?: number
  active?: number
}

export type IconGlyphAssetPageResp = ApiResponse<PageResponse<IconGlyphAssetVO>>
