export interface ProductBase {
  appId: number
  name: string
  designId: string
  price: number
  garminImageUrl: string
  garminStoreUrl: string
  heroFile: string | null
}

export interface Product {
  appId: number
  name: string
  description: string
  price: number
  garminImageUrl: string
  garminStoreUrl: string
  // Garmin 应用 UUID（可选）
  garminAppUuid?: string
  trialLasts: number
   // 设计 ID（在多个页面中会用到）
  designId: string
  createdAt?: string
  updatedAt?: string
  isDeleted?: number
  isActive?: number
  heroFile?: {
    url: string
  } | null
  categories?: Category[]
  status?: number
}

export interface ProductPayment {
  paymentMethod: string
  paymentMethodDesc: string
  kpayId: string
  wpayId: string
  price: number
  currency: string
  paddleProductId: string
  paddlePriceId: string
}

export interface ProductRelease {
  // 具体字段根据后端定义补充
  [key: string]: any
}

export interface ProductPageQuery {
  pageNum: number
  pageSize: number
  orderBy?: string
  name?: string
  populate?: string
  categoryId?: number
  userId?: number
  designUid?: string
}

export interface CreateProductDto {
  name: string;
  description: string;
  garminImageUrl?: string;
  garminStoreUrl?: string;
  trialLasts?: number;
  price?: number;
}

// 依赖类型
import type { Category } from '@/types/category'
import type { UserBase } from '@/types/user'

export interface ProductPackagingLogVO {
  id: number
  packagingStatus: string
  errorMessage: string | null
  createdAt: number
  updatedAt: number
  version: number
  isDeleted: number
  isActive: number
  // 打包类型：iq 或 prg
  type: string
  // 设备 ID
  deviceId: string
  // 队列优先级，0 为最高，数字越大优先级越低；如果不在队列中则为 null
  priority: number | null
  product: ProductBase & { user?: UserBase | null }
}

export interface ProductPackagingLogQuery {
  pageNum: number
  pageSize: number
  productId?: number | null
  userId?: number | null
  packagingStatus?: string | null // 支持逗号分隔的多个状态，如 "init,pending,complete"
}

// 打包状态常量
export const PACKAGING_STATUS = {
  INIT: 'init',
  PENDING: 'pending',
  COMPLETE: 'complete',
  FAILED: 'failed'
} as const

export type PackagingStatus = typeof PACKAGING_STATUS[keyof typeof PACKAGING_STATUS]

// 打包状态颜色映射
export const PACKAGING_STATUS_COLORS = {
  [PACKAGING_STATUS.INIT]: 'info',
  [PACKAGING_STATUS.PENDING]: 'warning',
  [PACKAGING_STATUS.COMPLETE]: 'success',
  [PACKAGING_STATUS.FAILED]: 'danger'
} as const

// 打包状态文本映射
export const PACKAGING_STATUS_TEXT = {
  [PACKAGING_STATUS.INIT]: '初始化',
  [PACKAGING_STATUS.PENDING]: '进行中',
  [PACKAGING_STATUS.COMPLETE]: '完成',
  [PACKAGING_STATUS.FAILED]: '失败'
} as const 