import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface ProductShareImageVO {
  id: number
  productId: number
  imageId: number
  type: 'share'
  sortOrder: number
  altText?: string
  imageUrl?: string
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
  return instance.get(`/admin/products/${appId}/share-images`)
}

export const uploadProductShareImages = (
  appId: number,
  files: File[],
): Promise<ApiResponse<ProductShareImageVO[]>> => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return instance.post(`/admin/products/${appId}/share-images`, formData)
}

export const deleteProductShareImage = (
  appId: number,
  productImageId: number,
): Promise<ApiResponse<void>> => {
  return instance.delete(`/admin/products/${appId}/share-images/${productImageId}`)
}
