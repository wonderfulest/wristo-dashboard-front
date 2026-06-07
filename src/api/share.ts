import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface ShareProductRequest {
  appId: number
  platforms?: string[]
  title?: string
  subtitle?: string
  brandLogo?: string
  bgColor?: string
}

export interface ShareImageVO {
  platform: string
  template: string
  imageUrl: string
  cached: boolean
  error?: string
}

export interface ShareProductVO {
  appId: number
  productName: string
  productImage: string
  shareImages: ShareImageVO[]
}

// Generate social media share images for a product
export const generateShareImages = (
  data: ShareProductRequest
): Promise<ApiResponse<ShareProductVO>> => {
  return instance.post('/public/share/product/generate', data)
}
