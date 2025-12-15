import type { PageQueryDTO } from './common'
import type { ProductBase } from '@/types/product'
import type { ImageVO } from '@/types/image'

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

// 每日图片 - 分页请求参数
export interface PickPageParams extends PageQueryDTO {
  appId: number
  fromNaturalDay?: string // YYYY-MM-DD, fetch records AFTER this day (inclusive of next day)
  orderBy?: string // e.g. "natural_day desc, id desc"
}

// 每日图片 - 选中记录 VO
export interface AppDailyImagePickVO {
  id: number
  naturalDay: string // YYYY-MM-DD
  dayOfYear: number
  appId: number
  imageId: number
  chosenAt?: string | null
  isActive: number
  isDeleted: number
  createdAt: string
  updatedAt: string
  // populated
  image?: ImageVO | null
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
