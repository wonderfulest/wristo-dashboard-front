import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'

export interface SegmentVO {
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

export interface SegmentCreateDTO {
  name: string
  ruleExpr?: string
  description?: string
  status?: number
}

export interface SegmentUpdateDTO {
  name?: string
  ruleExpr?: string
  description?: string
  status?: number
}

export interface SegmentPageQueryDTO {
  pageNum?: number
  pageSize?: number
  orderBy?: string
  name?: string
  status?: number
}

export const createSegment = (data: SegmentCreateDTO): Promise<ApiResponse<SegmentVO>> => {
  return instance.post('/admin/segment/create', data)
}

export const updateSegment = (id: number, data: SegmentUpdateDTO): Promise<ApiResponse<SegmentVO>> => {
  return instance.post(`/admin/segment/update/${id}`, data)
}

export const getSegment = (id: number): Promise<ApiResponse<SegmentVO>> => {
  return instance.get(`/admin/segment/${id}`)
}

export const deleteSegment = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`/admin/segment/delete/${id}`)
}

export const listSegments = (): Promise<ApiResponse<SegmentVO[]>> => {
  return instance.get('/admin/segment/list')
}

export const pageSegments = (dto: SegmentPageQueryDTO): Promise<ApiResponse<PageResponse<SegmentVO>>> => {
  return instance.post('/admin/segment/page', dto)
}

// 刷新所有分群
export const refreshAllSegments = (): Promise<ApiResponse<any>> => {
  return instance.post('/admin/segment/refresh-all')
}

// 刷新单个分群
export const refreshSegment = (id: number): Promise<ApiResponse<any>> => {
  return instance.post(`/admin/segment/${id}/refresh`)
}

// 启用分群
export const activateSegment = (id: number): Promise<ApiResponse<SegmentVO>> => {
  return instance.post('/admin/segment/active', undefined, { params: { id } })
}

// 关闭启用分群
export const deactivateSegment = (id: number): Promise<ApiResponse<SegmentVO>> => {
  return instance.post('/admin/segment/deactive', undefined, { params: { id } })
}
