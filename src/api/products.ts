import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { Category } from './category'

export interface Product {
  appId: number
  name: string
  description: string
  price: number
  garminImageUrl: string
  garminStoreUrl: string
  trialLasts: number
  createdAt?: string
  updatedAt?: string
  isDeleted?: number
  isActive?: number
  heroFile?: {
    url: string
  } | null
  categories?: Category[]
}

export interface ProductPageQuery {
  pageNum: number
  pageSize: number
  orderBy?: string
  name?: string
}

export interface ProductPageData {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  list: Product[]
}

export const fetchProductPage = (params: ProductPageQuery): Promise<ApiResponse<ProductPageData>> => {
  return instance.get('/admin/products/page', { params })
}

// 新增产品
export interface CreateProductDto {
  name: string;
  description: string;
  garminImageUrl?: string;
  garminStoreUrl?: string;
  trialLasts?: number;
  price?: number;
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
