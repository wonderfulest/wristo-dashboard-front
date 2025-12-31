import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  ThemeRulePageRequest,
  ThemeRuleUpsertDTO,
  ThemeRuleVO,
  ThemeConfigPageRequest,
  ThemeConfigUpsertDTO,
  ThemeConfigVO
} from '@/types/themes'

export function pageThemeRules(req: ThemeRulePageRequest): Promise<ApiResponse<PageResponse<ThemeRuleVO>>> {
  return instance.post('/admin/themes/rules/page?populate=product', req)
}

export function getThemeRuleDetail(appId: number): Promise<ApiResponse<ThemeRuleVO>> {
  return instance.get(`/admin/themes/rules/detail?appId=${appId}&populate=product`)
}

export function upsertThemeRule(dto: ThemeRuleUpsertDTO): Promise<ApiResponse<ThemeRuleVO>> {
  return instance.post('/admin/themes/rules/upsert', dto)
}

export function updateThemeRule(id: number, dto: ThemeRuleUpsertDTO): Promise<ApiResponse<ThemeRuleVO>> {
  return instance.post(`/admin/themes/rules/update/${id}`, dto)
}

export function deleteThemeRule(id: number): Promise<ApiResponse<void>> {
  return instance.post(`/admin/themes/rules/delete/${id}`)
}

export function getThemeRuleTypeConfigByCode(ruleType: string): Promise<ApiResponse<any>> {
  return instance.get('/admin/themes/rules/types/by-code', { params: { ruleType } })
}

export function pageThemeConfigs(req: ThemeConfigPageRequest): Promise<ApiResponse<PageResponse<ThemeConfigVO>>> {
  return instance.post('/admin/themes/configs/page?populate=product,image', req)
}

export function getThemeConfigDetail(id: number): Promise<ApiResponse<ThemeConfigVO>> {
  return instance.get(`/admin/themes/configs/detail/${id}?populate=product`)
}

export function createThemeConfig(dto: ThemeConfigUpsertDTO): Promise<ApiResponse<ThemeConfigVO>> {
  return instance.post('/admin/themes/configs/create', dto)
}

export function updateThemeConfig(id: number, dto: ThemeConfigUpsertDTO): Promise<ApiResponse<ThemeConfigVO>> {
  return instance.post(`/admin/themes/configs/update/${id}`, dto)
}

export function deleteThemeConfig(id: number): Promise<ApiResponse<void>> {
  return instance.post(`/admin/themes/configs/delete/${id}`)
}
