export interface ProductBase {
  appId: number
  name: string
  designId: string
  price: number
  garminImageUrl: string
  garminStoreUrl: string
  heroFile: string | null
}

export interface ProductImageVO {
  id?: number
  imageUrl?: string
  // 其他字段按需补充
  [key: string]: any
}

export interface BundleVO {
  bundleId: number
  userId: number
  bundleName: string
  // 其他字段按需补充
  [key: string]: any
}

export interface Product {
  /** 数据库主键 ID */
  id?: number
  /** 应用 ID */
  appId: number
  /** 对应 studio 平台设计 ID */
  designId: string
  /** 名称与描述 */
  name: string
  description: string
  /** 价格（后端 BigDecimal，对前端为 number） */
  price: number
  /** 原始图片 */
  rawImageUrl?: string
  /** Garmin 图片 / 商店 URL */
  garminImageUrl: string
  garminStoreUrl: string
  /** 产品横幅 */
  bannerImageUrl?: string
  /** Garmin 应用 UUID（可选） */
  garminAppUuid?: string
  /** 试用时长（小时） */
  trialLasts: number
  /** 下载次数 / 购买次数 */
  download?: number
  purchase?: number
  /** 关联用户 */
  user?: UserBase | null
  /** 状态、激活与删除标记 */
  status?: number
  isActive?: number
  isDeleted?: number
  /** 创建与更新时间、最后一次上线时间（LocalDateTime → string） */
  createdAt?: string
  updatedAt?: string
  lastGoLive?: string
  /** 封面图文件列表 */
  productImages?: ProductImageVO[]
  /** 旧字段：单一 heroFile，兼容老页面 */
  heroFile?: {
    url: string
  } | null
  /** 分类 */
  categories?: Category[]
  /** 支付信息 / 打包状态 / 发行包等（按需使用） */
  payment?: ProductPayment | null
  packageLog?: ProductPackagingLogVO | null
  release?: ProductRelease | null
  prgRelease?: ProductRelease | null
  packagingLog?: ProductPackagingLogVO | null
  prgPackagingLog?: ProductPackagingLogVO | null
  /** 关联 bundle 列表 */
  bundles?: BundleVO[]
  /** 支持设备 */
  devices?: import('./garmin-device').GarminDeviceVO[]
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
  type: string
  deviceId: string
  priority: number | null
  product: ProductBase & { user?: UserBase | null }
}

export interface ProductPackagingLogQuery {
  pageNum: number
  pageSize: number
  productId?: number | null
  userId?: number | null
  packagingStatus?: string | null
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