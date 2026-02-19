import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { Design, DesignPageQueryDTO } from '@/types/design'

// 管理端设计列表分页（支持是否模板等条件）
export const fetchDesignPage = (
  params: DesignPageQueryDTO
): Promise<ApiResponse<PageResponse<Design>>> => {
  return instance.get('/admin/design/page', { params })
}

// 更新设计是否为模板
// isTemplate: 0-否，1-是
export const updateDesignTemplateFlag = (
  designUid: string,
  isTemplate: number
): Promise<ApiResponse<boolean>> => {
  return instance.post('/admin/design/template', null, {
    params: { designUid, isTemplate }
  })
}
