import type { UserBase } from './user'
import type { ProductBase } from './product'
import type { PageQueryDTO } from './common'

export interface Bundle {
  bundleId: number
  userId: number
  bundleName: string
  bundleDesc: string
  price: number
  isActive: number
  bundleType?: 'account' | 'custom' | 'global' | string
  parentBundleId?: number | null
  createdAt: string
  updatedAt: string
  paddleProductId: string
  paddlePriceId: string
  user: UserBase | null
  products: ProductBase[] | null
  appCount?: number
  appTotalPrice?: number
}

export interface CreateBundleDto {
  bundleName: string
  bundleDesc: string
  price: number
  appIds: number[]
  userId?: number
  bundleType?: string
  parentBundleId?: number | null
}

export interface UpdateBundleDto {
  bundleName: string
  bundleDesc: string
  price: number
  appIds?: number[]
  userId?: number
  bundleType?: string
  parentBundleId?: number | null
} 

export interface BundlePageQuery extends PageQueryDTO {
  isActive?: number
}
