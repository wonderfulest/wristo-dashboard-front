import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { ImageVO } from '@/types/app-daily'

export const uploadImage = (file: File, usageType?: string): Promise<ApiResponse<ImageVO>> => {
  const form = new FormData()
  form.append('file', file)
  if (usageType) {
    form.append('usage_type', usageType)
  }
  return instance.post('/admin/image/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const uploadVideo = (file: File, usageType?: string): Promise<ApiResponse<ImageVO>> => {
  const form = new FormData()
  form.append('file', file)
  if (usageType) {
    form.append('usage_type', usageType)
  }
  return instance.post('/admin/image/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 分页查询图片素材
export interface ImagePageParams {
  pageNum?: number
  pageSize?: number
  orderBy?: string
  usageType?: string
}

export const pageImages = (
  params: ImagePageParams
): Promise<ApiResponse<PageResponse<ImageVO>>> => {
  return instance.post('/admin/image/page', params)
}
