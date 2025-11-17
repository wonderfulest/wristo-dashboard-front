import type { PageQueryDTO, PageResponse, ApiResponse } from './common'

export interface IconAssetVO {
  id: number
  iconId: number
  assetCode: string
  sourceType: string
  format: string
  displayType?: string
  imageUrl?: string
  previewUrl?: string
  author?: string
  license?: string
  tags?: string
  version?: number
  isActive?: number
}

export interface IconAssetCreateDTO {
  iconId: number
  assetCode: string
  sourceType: string
  format: string
  displayType?: string
  svgContent?: string
  imageUrl?: string
  previewUrl?: string
  author?: string
  license?: string
  tags?: string
  version?: number
  isActive?: number
}

export interface IconAssetUpdateDTO extends Partial<IconAssetCreateDTO> {
  id: number
}

export interface IconAssetPageQueryDTO extends PageQueryDTO {
  iconId?: number
  iconUnicode?: string
  displayType?: string
  active?: number
}

export type IconAssetPageResp = ApiResponse<PageResponse<IconAssetVO>>
