export interface FetchDesignReviewPageParams {
  pageNum: number
  pageSize: number
  userId?: number
  orderBy?: string
  designStatus?: string
  designUid?: string
  name?: string
  populate?: string
}

// 管理端设计分页查询 DTO（支持是否模板等条件）
export interface DesignPageQueryDTO {
  pageNum: number
  pageSize: number
  orderBy?: string
  designStatus?: string
  designUid?: string
  name?: string
  userId?: number
  isTemplate?: number
  populate?: string
}

import type { UserBase } from './user'
import type { ImageVO } from './image'
import type { Product, ProductPayment, ProductRelease } from './product'

export interface Design {
  id: number
  designUid: string
  name: string
  description: string
  configJson: any
  designStatus: string
  isActive: number
  isDeleted: number
  createdAt: number
  updatedAt: number
  version: number
  // 是否模板：0-否，1-是
  isTemplate?: number
  user: UserBase
  product?: Product | null
  coverImage: ImageVO | null
  backgroundImage: ImageVO | null
  payment: ProductPayment | null
  release: ProductRelease | null
}

 