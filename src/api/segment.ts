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
  code: string
  category?: string
  type?: string
  ruleExpr?: string
  description?: string
  status?: number
}

export interface SegmentUpdateDTO {
  name?: string
  category?: string
  type?: string
  ruleExpr?: string
  description?: string
  status?: number
}

export interface SegmentPageQueryDTO {
  pageNum?: number
  pageSize?: number
  orderBy?: string
  name?: string
  code?: string
  category?: string
  type?: string
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
