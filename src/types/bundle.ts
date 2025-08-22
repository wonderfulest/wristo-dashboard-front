import type { UserBase } from './user'
import type { ProductBase } from './product'

export interface Bundle {
  bundleId: number
  userId: number
  bundleName: string
  bundleDesc: string
  price: number
  isActive: number
  createdAt: string
  updatedAt: string
  paddleProductId: string
  paddlePriceId: string
  user: UserBase | null
  products: ProductBase[] | null
}

export interface CreateBundleDto {
  bundleName: string
  bundleDesc: string
  price: number
  appIds: number[]
}

export interface UpdateBundleDto {
  bundleName: string
  bundleDesc: string
  price: number
  appIds: number[]
} 