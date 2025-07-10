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

import type { UserBase } from './user'
import type { Image } from './image'
import type { ProductPayment, ProductRelease } from './product'

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
  user: UserBase
  coverImage: Image | null
  backgroundImage: Image | null
  payment: ProductPayment | null
  release: ProductRelease | null
}

 