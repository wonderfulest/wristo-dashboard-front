import type { PageQueryDTO } from './common'
import type { ProductBase } from '@/types/product'

export interface AppDailyImageConfig {
  id: number
  appId: number
  isEnabled: number
  selectionMode: string
  fixedImageId: number | null
  noRepeatDays: number | null
  refreshTime: string | null
  maxDailyPick: number | null
  useWeight: number | null
  remark: string | null
  isActive: number
  isDeleted: number
  createdAt: string
  updatedAt: string
  // populated
  product?: ProductBase
  fixedImage?: ImageVO | null
}

export interface AppDailyConfigPageParams extends PageQueryDTO {
  appId?: number
}

// 对应后端 ImageVO 返回结构的必要字段
export interface ImageVO {
  id: number
  documentId?: string
  name?: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  formats?: Record<string, any>
  hash?: string
  ext?: string
  mime?: string
  size?: number
  url?: string
  previewUrl?: string
  provider?: string
  providerMetadata?: Record<string, any>
  folderPath?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  locale?: string
}

export interface AppDailyImageRelation {
  id: number
  appId: number
  imageId: number
  image?: ImageVO | null
  weight: number
  sort: number
  isActive: number
  isDeleted: number
  createdAt: string
  updatedAt: string
}

export interface RelationPageParams extends PageQueryDTO {
  appId: number
}

export interface ConfigUpsertDTO {
  appId: number
  isEnabled?: number // 1-启用 0-停用
  selectionMode?: string // weighted_random | fixed | sequential
  fixedImageId?: number | null
  noRepeatDays?: number | null
  refreshTime?: string | null // HH:mm:ss
  maxDailyPick?: number | null
  useWeight?: number | null // 1-启用 0-忽略
  remark?: string | null
  isActive?: number | null
}
