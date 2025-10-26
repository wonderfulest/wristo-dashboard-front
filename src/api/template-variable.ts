import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  TemplateVariableVO,
  TemplateVariableQueryDTO,
  TemplateVariablePreviewContextDTO,
  TemplateVariableCreateDTO,
  TemplateVariableUpdateDTO
} from '@/types/template-variable'

const BASE = '/admin/system/template-variables'

export function getTemplateVariable(id: number) {
  return instance.get<ApiResponse<TemplateVariableVO>>(`${BASE}/${id}`)
}

export function listTemplateVariables(query: TemplateVariableQueryDTO) {
  return instance.get<ApiResponse<TemplateVariableVO[]>>(BASE, { params: query })
}

export function pageTemplateVariables(query: TemplateVariableQueryDTO) {
  return instance.post<ApiResponse<PageResponse<TemplateVariableVO>>>(`${BASE}/page`, query)
}

export function previewTemplateVariableContext(dto: TemplateVariablePreviewContextDTO) {
  return instance.post<ApiResponse<Record<string, any>>>(`${BASE}/preview-context`, dto)
}

export function createTemplateVariable(dto: TemplateVariableCreateDTO) {
  return instance.post<ApiResponse<TemplateVariableVO>>(BASE, dto)
}

export function updateTemplateVariable(dto: TemplateVariableUpdateDTO) {
  return instance.put<ApiResponse<TemplateVariableVO>>(BASE, dto)
}

export function deleteTemplateVariable(id: number) {
  return instance.delete<ApiResponse<void>>(`${BASE}/${id}`)
}
