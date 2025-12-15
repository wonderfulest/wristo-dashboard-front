import type { PageQueryDTO } from './common'
import type { UserBase } from './user'

export interface InspirationFileVO {
  id: number
  name: string
  url: string
  previewUrl?: string
  provider?: string
}

export interface InspirationVO {
  id: number
  title: string
  previewImageId: number
  assetZipId: number
  sourcePageUrl?: string
  rating?: number
  designerNote?: string

  userId: number
  version: number
  isActive: number
  createdAt: string
  updatedAt: string

  previewImage?: InspirationFileVO
  assetZip?: InspirationFileVO
  author?: UserBase
}

export interface InspirationCreateDTO {
  title: string
  previewImageId: number
  assetZipId?: number
  sourcePageUrl?: string
  rating?: number
  designerNote?: string

  userId?: number
  isActive: number
}

export interface InspirationUpdateDTO {
  id: number
  title?: string
  previewImageId?: number
  assetZipId?: number
  sourcePageUrl?: string
  rating?: number
  designerNote?: string

  userId?: number
  isActive?: number
}

export interface InspirationPageQueryDTO extends PageQueryDTO {
  userId?: number
  rating?: number
  isActive?: number
  keyword?: string
}
