import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { AppDailyImageConfig, AppDailyConfigPageParams, AppDailyImageRelation, RelationPageParams, ConfigUpsertDTO } from '@/types/app-daily'

// 分页查询每日一图配置
export function fetchAppDailyConfigPage(
  params: AppDailyConfigPageParams
): Promise<ApiResponse<PageResponse<AppDailyImageConfig>>> {
  return instance.post('/admin/app-daily/config/page', params)
}

// 获取指定 app 的配置详情
export function getAppDailyConfigDetail(appId: number): Promise<ApiResponse<AppDailyImageConfig>> {
  return instance.get(`/admin/app-daily/config/detail/${appId}`)
}

// 新增/保存 配置
export function saveAppDailyConfig(dto: ConfigUpsertDTO): Promise<ApiResponse<AppDailyImageConfig>> {
  return instance.post('/admin/app-daily/config', dto)
}

// 获取指定 app 的图片关系列表
export function listAppDailyRelations(appId: number): Promise<ApiResponse<AppDailyImageRelation[]>> {
  return instance.get(`/admin/app-daily/relations/${appId}`)
}

// 分页查询图片关系列表（返回包含 image 对象）
export function pageAppDailyRelations(
  params: RelationPageParams
): Promise<ApiResponse<PageResponse<AppDailyImageRelation>>> {
  return instance.post('/admin/app-daily/relations/page', params)
}

// 新增图片关系（可上传图片文件）
export interface CreateRelationParams {
  appId: number
  weight?: number
  sort?: number
  isActive?: number
  file?: File | null
}

export function createAppDailyRelation(params: CreateRelationParams): Promise<ApiResponse<AppDailyImageRelation>> {
  const form = new FormData()
  form.append('appId', String(params.appId))
  if (params.weight !== undefined && params.weight !== null) form.append('weight', String(params.weight))
  if (params.sort !== undefined && params.sort !== null) form.append('sort', String(params.sort))
  if (params.isActive !== undefined && params.isActive !== null) form.append('isActive', String(params.isActive))
  if (params.file) form.append('file', params.file)

  return instance.post('/admin/app-daily/relations', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
