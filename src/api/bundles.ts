import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { Bundle, CreateBundleDto, UpdateBundleDto } from '@/types/bundle'

// 获取所有套餐列表
export const fetchBundles = (): Promise<ApiResponse<Bundle[]>> => {
  return instance.get('/bundles/all-by-user')
}

// 新增套餐
export const createBundle = (data: CreateBundleDto): Promise<ApiResponse<Bundle>> => {
  return instance.post('/bundles', data)
}

export const updateBundle = (data: UpdateBundleDto, bundleId: number): Promise<ApiResponse<Bundle>> => {
  return instance.post(`/bundles/update/${bundleId}`, data)
}

export const getBundle = (bundleId: number): Promise<ApiResponse<Bundle>> => {
  return instance.get(`/bundles/${bundleId}`)
}

export const updateBundleActive = (bundleId: number, isActive: number): Promise<ApiResponse<Bundle>> => {
  return instance.post(`/bundles/${bundleId}/activate/${isActive}`)
}