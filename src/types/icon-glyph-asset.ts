import type { ApiResponse } from './api'
import type { IconLibraryVO } from './icon-library'
import type { IconAssetVO } from './icon-asset'

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
