import type { ProductBase } from './product'
import type { Bundle } from './bundle'
import type { UserBase } from './user'

export interface PurchaseRecordVO {
  id: number | null
  userId: number
  email: string
  accountToken: string
  partNumber: string
  origin: string
  appId: number
  bundleId: number
  isBundle: boolean
  product: ProductBase | null
  bundle: Bundle | null
  transactionId: string
  customerId: string
  addressId: string
  countryCode: string
  orderProductName?: string | null
  deviceDisplayName?: string | null
  paymentMethod: string
  fee: number | null
  tax: number | null
  total: number | null
  credit: number | null
  balance: number | null
  discount: number | null
  earnings: number | null
  subtotal: number | null
  grandTotal: number | null
  currencyCode: string | null
  creditToBalance: number | null
  status: number
  inPayout: number | null
  commissionEnabled?: boolean
  giftAmountCny?: number | null
  giftExchangeRate?: number | null
  statusDesc: string
  createdAt: string
  updatedAt: string
  version: number
  user: UserBase | null
}

export interface PurchaseRecordPageQueryDTO {
  origin?: string | null
  pageNum: number
  pageSize: number
  email?: string | null
  appId?: number | null
  bundleId?: number | null
  status?: number | null
  userId?: number
}

export type GiftEntitlementTargetType = 'APP' | 'BUNDLE'
export type GiftEntitlementChannel = 'taobao' | 'xiaohongshu' | 'xianyu' | 'wristo_cn' | 'other'
export type GiftEntitlementPaymentMethod = 'alipay' | 'wechat' | 'other'

export interface GiftEntitlementRequest {
  email: string
  targetType: GiftEntitlementTargetType
  appId?: number | null
  activationCode?: string | null
  bundleId?: number | null
  channel: GiftEntitlementChannel
  paymentMethod?: GiftEntitlementPaymentMethod | null
  externalOrderId?: string | null
  commissionEnabled: boolean
  giftAmountCny?: number | null
  giftExchangeRate?: number | null
}

export interface BusinessOverviewVO {
  downloads: number
  firstDownloads: number
  repeatDownloads: number
  purchasedDevices: number
  orders: number
  revenue: number
  updatedAt: string | null
  ready: boolean
  lagSeconds: number | null
}
