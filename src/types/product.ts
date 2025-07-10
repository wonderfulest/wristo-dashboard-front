export interface Product {
  appId: number
  name: string
  description: string
  price: number
  garminImageUrl: string
  garminStoreUrl: string
  trialLasts: number
  createdAt?: string
  updatedAt?: string
  isDeleted?: number
  isActive?: number
  heroFile?: {
    url: string
  } | null
  categories?: Category[]
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