import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type {
  IconAssetVO,
  IconAssetCreateDTO,
  IconAssetUpdateDTO,
  IconAssetPageQueryDTO
} from '@/types/icon-asset'

export function createIconAsset(dto: IconAssetCreateDTO) {
  return instance.post<ApiResponse<IconAssetVO>>('/admin/icon-asset/create', dto)
}

export function updateIconAsset(id: number, dto: Partial<IconAssetUpdateDTO>) {
  return instance.post<ApiResponse<IconAssetVO>>(`/admin/icon-asset/update/${id}`, dto)
}

export function removeIconAsset(id: number) {
  return instance.post<ApiResponse<boolean>>(`/admin/icon-asset/remove/${id}`)
}

export function getIconAsset(id: number) {
  return instance.get<ApiResponse<IconAssetVO>>(`/admin/icon-asset/get/${id}`)
}

export function pageIconAsset(dto: IconAssetPageQueryDTO) {
  return instance.post('/admin/icon-asset/page', dto)
}

export function getIconAssetDetail(id: number, params?: Record<string, any>) {
  return instance.get<ApiResponse<IconAssetVO>>(`/admin/icon-asset/get/${id}`, { params })
}

export function cropIconSvg(dto: { id: number; svgContent: string }) {
  return instance.post<ApiResponse<IconAssetVO>>('/admin/icon-asset/crop-svg', dto)
}

export function uploadIconSvg(
  file: File,
  unicode: string,
  onUploadProgress?: (evt: any) => void
) {
  const form = new FormData()
  form.append('file', file)
  form.append('unicode', unicode)
  return instance.post<ApiResponse<IconAssetVO>>('/admin/icon-asset/upload-svg', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  })
}
