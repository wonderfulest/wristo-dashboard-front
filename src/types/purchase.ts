import type { ProductBase } from './product'
import type { Bundle } from './bundle'
import type { UserBase } from './user'

export interface PurchaseRecordVO {
  id: number
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
  paymentMethod: string
  fee: number
  tax: number
  total: number
  credit: number
  balance: number
  discount: number
  earnings: number
  subtotal: number
  grandTotal: number
  currencyCode: string
  creditToBalance: number
  status: number
  inPayout: number
  statusDesc: string
  createdAt: string
  updatedAt: string
  version: number
  user: UserBase | null
}

export interface PurchaseRecordPageQueryDTO {
  pageNum: number
  pageSize: number
  email?: string | null
  appId?: number | null
  bundleId?: number | null
  status?: number | null
  userId?: number
}
