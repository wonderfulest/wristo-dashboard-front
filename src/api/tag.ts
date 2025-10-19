import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'

export interface TagVO {
  id: number
  name: string
  code: string
  category: string
  type: string
  ruleExpr: string
  description: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface TagCreateDTO {
  name: string
  code: string
  category?: string
  type?: string
  ruleExpr?: string
  description?: string
  status?: number
}

export interface TagUpdateDTO {
  name?: string
  category?: string
  type?: string
  ruleExpr?: string
  description?: string
  status?: number
}

export interface TagPageQueryDTO {
  pageNum?: number
  pageSize?: number
  orderBy?: string
  name?: string
  code?: string
  category?: string
  type?: string
  status?: number
}

export const createTag = (data: TagCreateDTO): Promise<ApiResponse<TagVO>> => {
  return instance.post('/admin/tag/create', data)
}

export const updateTag = (id: number, data: TagUpdateDTO): Promise<ApiResponse<TagVO>> => {
  return instance.post(`/admin/tag/update/${id}`, data)
}

export const getTag = (id: number): Promise<ApiResponse<TagVO>> => {
  return instance.get(`/admin/tag/${id}`)
}

export const deleteTag = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`/admin/tag/delete/${id}`)
}

export const listTags = (): Promise<ApiResponse<TagVO[]>> => {
  return instance.get('/admin/tag/list')
}

export const pageTags = (dto: TagPageQueryDTO): Promise<ApiResponse<PageResponse<TagVO>>> => {
  return instance.post('/admin/tag/page', dto)
}

export const assignTagToUser = (
  userId: number,
  tagId: number,
  assignedType: 'manual' | 'rule' = 'manual'
): Promise<ApiResponse<void>> => {
  const params = new URLSearchParams()
  params.append('userId', String(userId))
  params.append('tagId', String(tagId))
  params.append('assignedType', assignedType)
  return instance.post(`/admin/tag/assign?${params.toString()}`)
}

export const removeTagFromUser = (
  userId: number,
  tagId: number
): Promise<ApiResponse<void>> => {
  const params = new URLSearchParams()
  params.append('userId', String(userId))
  params.append('tagId', String(tagId))
  return instance.post(`/admin/tag/remove?${params.toString()}`)
}
