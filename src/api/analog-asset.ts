import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  AnalogAssetVO,
  AnalogAssetCreateDTO,
  AnalogAssetUpdateDTO,
  AnalogAssetPageQueryDTO,
  AnalogAssetType
} from '@/types/analog-asset'

const BASE_URL = '/admin/analog-asset'

/**
 * 创建素材
 */
export function createAnalogAsset(
  data: AnalogAssetCreateDTO,
  userId?: number
): Promise<ApiResponse<AnalogAssetVO>> {
  const params = userId ? { userId } : undefined
  return instance.post(`${BASE_URL}/create`, data, { params })
}

/**
 * 更新素材
 */
export function updateAnalogAsset(
  data: AnalogAssetUpdateDTO
): Promise<ApiResponse<AnalogAssetVO>> {
  return instance.post(`${BASE_URL}/update`, data)
}

/**
 * 删除素材
 */
export function removeAnalogAsset(id: number): Promise<ApiResponse<boolean>> {
  return instance.post(`${BASE_URL}/remove`, null, { params: { id } })
}

/**
 * 获取素材详情
 */
export function getAnalogAssetById(id: number): Promise<ApiResponse<AnalogAssetVO>> {
  return instance.post(`${BASE_URL}/get`, null, { params: { id } })
}

/**
 * 根据slug获取素材
 */
export function getAnalogAssetBySlug(slug: string): Promise<ApiResponse<AnalogAssetVO>> {
  return instance.get(`${BASE_URL}/get-by-slug/${slug}`)
}

/**
 * 分页查询素材
 */
export function pageAnalogAsset(
  data: AnalogAssetPageQueryDTO
): Promise<ApiResponse<PageResponse<AnalogAssetVO>>> {
  return instance.post(`${BASE_URL}/page?populate=asset,author`, data)
}

/**
 * 根据用户ID获取素材列表
 */
export function listAnalogAssetByUserId(userId: number): Promise<ApiResponse<AnalogAssetVO[]>> {
  return instance.get(`${BASE_URL}/list-by-user/${userId}`)
}

/**
 * 统计用户素材数量
 */
export function countAnalogAssetByUserId(userId: number): Promise<ApiResponse<number>> {
  return instance.get(`${BASE_URL}/count-by-user/${userId}`)
}

/**
 * 统计指定类型素材数量
 */
export function countAnalogAssetByType(type: AnalogAssetType): Promise<ApiResponse<number>> {
  return instance.get(`${BASE_URL}/count-by-type/${type}`)
}

/**
 * 批量获取素材
 */
export function listAnalogAssetByIds(ids: number[]): Promise<ApiResponse<AnalogAssetVO[]>> {
  return instance.post(`${BASE_URL}/list-by-ids`, ids)
}

/**
 * 上传素材文件
 */
export function uploadAnalogAsset(
  file: File,
  type: AnalogAssetType,
  options?: { userId?: number; isSystem?: boolean }
): Promise<ApiResponse<AnalogAssetVO>> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  if (options?.userId !== undefined) {
    formData.append('userId', String(options.userId))
  }
  if (options?.isSystem !== undefined) {
    formData.append('isSystem', String(options.isSystem))
  }
  return instance.post(`${BASE_URL}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 设置是否为系统素材
 */
export function setAnalogAssetSystem(
  id: number,
  isSystem: boolean
): Promise<ApiResponse<AnalogAssetVO>> {
  return instance.post(`${BASE_URL}/set-system`, null, {
    params: { id, isSystem }
  })
}
