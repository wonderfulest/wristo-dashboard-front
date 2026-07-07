import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { Bundle, BundlePageQuery, CreateBundleDto, UpdateBundleDto } from '@/types/bundle'

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

export const fetchAdminBundlePage = (params: BundlePageQuery): Promise<ApiResponse<PageResponse<Bundle>>> => {
  return instance.get('/admin/bundles/page?populate=user,products', { params })
}

export const getAdminBundle = (bundleId: number): Promise<ApiResponse<Bundle>> => {
  return instance.get(`/admin/bundles/${bundleId}?populate=user,products`)
}

export const createAdminBundle = (data: CreateBundleDto): Promise<ApiResponse<Bundle>> => {
  return instance.post('/admin/bundles/create?populate=user,products', data)
}

export const updateAdminBundle = (bundleId: number, data: UpdateBundleDto): Promise<ApiResponse<Bundle>> => {
  return instance.post(`/admin/bundles/update/${bundleId}?populate=user,products`, data)
}

export const deleteAdminBundle = (bundleId: number): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/bundles/delete/${bundleId}`)
}

export const physicalDeleteNonMerchantAccountBundles = (): Promise<ApiResponse<number>> => {
  return instance.post('/admin/bundles/physical-delete/non-merchant-account')
}

export const updateAdminBundleActive = (bundleId: number, isActive: number): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/bundles/${bundleId}/activate/${isActive}`)
}
