import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface Bundle {
  bundleId: number
  bundleName: string
  bundleDesc: string
  price: number
  isActive: number
  createdAt: string
  updatedAt: string
  products: any[]
}

// 获取所有套餐列表
export const fetchBundles = (): Promise<ApiResponse<Bundle[]>> => {
  return instance.get('/bundles')
}

// 新增套餐
export interface CreateBundleDto {
  bundleName: string
  bundleDesc: string
  price: number
  appIds: number[]
}
export const createBundle = (data: CreateBundleDto): Promise<ApiResponse<Bundle>> => {
  return instance.post('/bundles', data)
}

export interface UpdateBundleDto {
  bundleName: string
  bundleDesc: string
  price: number
  appIds: number[]
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