import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface ProductShareImageVO {
  id: number
  productId: number
  imageId: number
  type: string
  sortOrder: number
  altText?: string
  imageUrl?: string
  previewUrl?: string
  downloadUrl?: string
  width?: number
  height?: number
  fileName?: string
  image?: {
    id: number
    name?: string
    url?: string
  }
}

export const fetchProductShareImages = (
  appId: number,
): Promise<ApiResponse<ProductShareImageVO[]>> => {
  return instance.get(`/admin/products/${appId}/images`)
}

export const uploadProductShareImages = (
  appId: number,
  files: File[],
): Promise<ApiResponse<ProductShareImageVO[]>> => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return instance.post(`/admin/products/${appId}/images`, formData)
}

export const deleteProductShareImage = (
  appId: number,
  productImageId: number,
): Promise<ApiResponse<void>> => {
  return instance.delete(`/admin/products/${appId}/images/${productImageId}`)
}
