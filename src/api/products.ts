import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { Product, ProductPackagingLogQuery, ProductPackagingLogVO, ProductPageQuery } from '@/types/product'

export const fetchProductPage = (params: ProductPageQuery): Promise<ApiResponse<PageResponse<Product>>> => {
  return instance.post('/admin/products/page?populate=*', params)
}

// 分页查询打包日志
export const getProductPackagingLogsPage = (params: ProductPackagingLogQuery): Promise<ApiResponse<PageResponse<ProductPackagingLogVO>>> => {
  return instance.post('/admin/products/packaging-log/page', params)
} 

// 查询单个产品
export const getProduct = (appId: number): Promise<ApiResponse<Product>> => {
  return instance.get(`/admin/products/${appId}`)
}

// 更新产品
export const updateProduct = (appId: number, data: Partial<Product>): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/update/${appId}`, data)
}

// 更新产品状态
export const updateProductStatus = (appId: number, isActive: number): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/active/${appId}/${isActive}`)
}

// 切换产品上架/下架状态
export const toggleProductStatus = (appId: number, status: number): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/products/status/${appId}/${status}`)
}

// 更新产品分类
export const updateProductCategories = (appId: number, categoryIds: number[]): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/category/${appId}`, { categoryIds })
}

// 添加分类
export const addProductCategory = (appId: number, categoryId: number): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/category/${appId}/add?categoryId=${categoryId}`)
}

// 删除分类
export const deleteProductCategory = (appId: number, categoryId: number): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/category/${appId}/delete?categoryId=${categoryId}`)
}
