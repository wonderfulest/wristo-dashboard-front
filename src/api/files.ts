import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { FileVO } from '@/types/font-glyph'

// 上传产品图片
export const uploadProductHeroImage = async (file: File): Promise<ApiResponse<string>> => {
  const formData = new FormData()
  formData.append('file', file as unknown as Blob)
  formData.append('type', 'hero')
  return instance.post('/admin/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 通用管理端文件上传（带鉴权），配合 AdmFileController /api/admin/file/upload/object
export const uploadAdminFile = async (file: File, usageType: string): Promise<ApiResponse<FileVO>> => {
  const formData = new FormData()
  formData.append('file', file as unknown as Blob)
  formData.append('usageType', usageType)
  return instance.post('/admin/file/upload/object', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
