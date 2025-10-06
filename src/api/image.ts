import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { ImageVO } from '@/types/app-daily'

export const uploadImage = (file: File): Promise<ApiResponse<ImageVO>> => {
  const form = new FormData()
  form.append('file', file)
  return instance.post('/admin/image/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
