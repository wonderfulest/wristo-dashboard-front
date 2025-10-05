import type { PageQueryDTO } from './common'

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
}

export interface AppDailyConfigPageParams extends PageQueryDTO {
  appId?: number
}

export interface AppDailyImageRelation {
  id: number
  appId: number
  imageId: number
  weight: number
  sort: number
  isActive: number
  isDeleted: number
  createdAt: string
  updatedAt: string
}
