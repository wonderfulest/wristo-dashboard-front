import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { DesignFontVO, DesignFontPageQueryDTO } from '@/types/font'

// 审核接口：提交状态为 Pending / Approved / Rejected，通过 slug 修改状态
export function reviewFont(slug: string, status: string) {
  return instance.post<ApiResponse<DesignFontVO>>('/admin/fonts/review', null, { params: { slug, status } })
}

// 批量审核接口：提交状态为 Pending / Approved / Rejected
export function reviewFontsBatch(ids: number[], status: string) {
  return instance.post<ApiResponse<DesignFontVO[]>>('/admin/fonts/review-batch', ids, { params: { status } })
}

// 按 ID 获取
export function getFont(id: number, populate?: string) {
  return instance.get<ApiResponse<DesignFontVO>>(`/admin/fonts/get/${id}`, { params: { populate } })
}

// 按 slug 获取
export function getFontBySlug(slug: string) {
  return instance.get<ApiResponse<DesignFontVO>>(`/admin/fonts/get-by-slug/${slug}?populate=ttf,user`)
}

// 列表（全部）
export function listFonts() {
  return instance.get<ApiResponse<DesignFontVO[]>>('/admin/fonts/list')
}

// 删除（软删）
export function removeFont(id: number) {
  return instance.post<ApiResponse<boolean>>(`/admin/fonts/remove/${id}`)
}

// 分页查询
export function pageFonts(dto: DesignFontPageQueryDTO) {
  const { populate, ...data } = dto as any
  const config = populate ? { params: { populate } } : undefined
  return instance.post<ApiResponse<PageResponse<DesignFontVO>>>('/admin/fonts/page', data, config)
}

// 更新字体属性
export function updateFont(id: number, payload: Partial<DesignFontVO>) {
  return instance.post<ApiResponse<DesignFontVO>>(`/admin/fonts/update/${id}`, payload)
}

// 切换是否为系统字体
export function toggleFontSystem(id: number, enable: boolean) {
  return instance.post<ApiResponse<DesignFontVO>>(`/admin/fonts/system/${id}`, null, { params: { enable } })
}

// 更新 TTF 文件
export function updateFontTtf(id: number, file: File) {
  const formData = new FormData()
  formData.append('ttf', file)
  return instance.post<ApiResponse<DesignFontVO>>(`/admin/fonts/update-ttf/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Public: list font type codes
export function listPublicFontTypes() {
  return instance.get<ApiResponse<string[]>>('/public/fonts/types')
}

// 管理员上传自定义字体，仅上传 TTF 文件
export function uploadOnlyTtf(file: File, type: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return instance.post<ApiResponse<DesignFontVO>>('/admin/fonts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function autoIconFontBuild(glyphCode: string) {
  return instance.post<ApiResponse<DesignFontVO>>(`/admin/fonts/auto-icon-font-build/${glyphCode}`)
}
