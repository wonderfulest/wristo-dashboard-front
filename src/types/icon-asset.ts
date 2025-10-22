import type { PageQueryDTO, PageResponse, ApiResponse } from './common'

export interface IconAssetVO {
  id: number
  iconId: number
  assetCode: string
  sourceType: string
  format: string
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
  active?: number
  keyword?: string
}

export type IconAssetPageResp = ApiResponse<PageResponse<IconAssetVO>>
