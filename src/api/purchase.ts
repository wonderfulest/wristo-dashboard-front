import instance from '@/config/axios'
import type {
  ApiResponse,
  PurchaseRecordPageQueryDTO,
  PageResponse,
  PurchaseRecordVO,
  AppSalesSummaryPageQueryDTO,
  AppSalesSummaryVO,
  SalesQueryDTO,
  AppFunnelVO,
  DailySalesItemVO,
  DeviceOrderStatsVO,
  DeviceOrderStatsPageQueryDTO
} from '@/types/api'

export const getPurchaseRecordPageList = async (dto: PurchaseRecordPageQueryDTO): Promise<ApiResponse<PageResponse<PurchaseRecordVO>>> => {
  return instance.post('/admin/purchases/page?populate=product,bundle,user', dto)
}

export const getAppSalesSummaryPage = async (
  dto: AppSalesSummaryPageQueryDTO
): Promise<ApiResponse<PageResponse<AppSalesSummaryVO>>> => {
  return instance.post('/admin/purchases/app/summary/page?populate=product', dto)
}

export const getFunnel = async (dto: SalesQueryDTO): Promise<ApiResponse<AppFunnelVO>> => {
  return instance.post('/admin/purchases/funnel', dto)
}

export const getSales = async (
  dto?: SalesQueryDTO
): Promise<ApiResponse<DailySalesItemVO[]>> => {
  return instance.post('/admin/purchases/sales', dto)
}

export const getDeviceOrderSummary = async (
  dto: DeviceOrderStatsPageQueryDTO
): Promise<ApiResponse<PageResponse<DeviceOrderStatsVO>>> => {
  return instance.post('/admin/purchases/device/summary', dto)
}
