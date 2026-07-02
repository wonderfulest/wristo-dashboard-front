import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { Product } from '@/types/product'

export interface WatchfaceMarketingAssetGenerateRequest {
  appId: number
  sellingPoints?: string
}

export interface WatchfaceMarketingAssetVO {
  product: Product
  xiaohongshuPost: string
  instagramPost: string
  model: string
}

export const generateWatchfaceMarketingAssets = (
  data: WatchfaceMarketingAssetGenerateRequest
): Promise<ApiResponse<WatchfaceMarketingAssetVO>> => {
  return instance.post('/admin/marketing/watchface-assets/generate', data)
}
