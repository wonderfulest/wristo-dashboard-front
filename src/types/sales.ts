import type { ProductBase } from './product'

// ===== Daily Sales (last 60 days) =====
export interface DailySalesItemVO {
  /** yyyy-MM-dd */
  date: string
  /** 当日订单数 */
  orderCount: number
  /** 当日收益 */
  earnings: number
}

// ===== App Sales Summary =====
export interface AppSalesSummaryVO {
  appId: number
  salesCount: number
  totalAmount: number
  bundleTriggerCount: number
  app: ProductBase | null
}

export interface AppSalesSummaryPageQueryDTO {
  pageNum: number
  pageSize: number
  userId?: number
}

// ===== Funnel (Downloads -> Code Displayed -> Code Entered -> Start Purchase -> Purchases) =====
export interface SalesQueryDTO {
  /** 可不传，后端会从登录上下文填充 */
  userId?: number
  /** 开始日期，yyyy-MM-dd */
  startDate: string
  /** 结束日期，yyyy-MM-dd */
  endDate: string
  /** 可选过滤：appId */
  appId?: number | null
}

export interface AppFunnelVO {
  /** 统计周期键，如 2025-08-01~2025-08-14 */
  periodKey: string
  /** 应用ID */
  appId: number | null
  /** 下载 */
  downloads: number
  /** 弹码 */
  codeDisplayed: number
  /** 输入码 */
  codeEntered: number
  /** 开始购买 */
  startPurchase: number
  /** 应用购买 */
  appPurchases: number
  /** 套餐购买 */
  bundlePurchases: number
  /** 应用信息 */
  app: ProductBase | null
}
