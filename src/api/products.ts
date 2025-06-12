import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

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
}

export interface ProductPageQuery {
  pageNum: number
  pageSize: number
  orderBy?: string
}

export interface ProductPageData {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  list: Product[]
}

export const fetchProductPage = (params: ProductPageQuery): Promise<ApiResponse<ProductPageData>> => {
  return instance.post('/products/page', params)
}

export const fetchAllProducts = (): Promise<ApiResponse<Product[]>> => {
  return instance.get('/products/all-by-user')
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

export const createProduct = (data: CreateProductDto): Promise<ApiResponse<Product>> => {
  return instance.post('/products', data)
}

// 查询单个产品
export const getProduct = (appId: number): Promise<ApiResponse<Product>> => {
  return instance.get(`/products/${appId}`)
}

// 更新产品
export const updateProduct = (appId: number, data: Partial<Product>): Promise<ApiResponse<Product>> => {
  return instance.post(`/products/update/${appId}`, data)
}

// 上传产品图片
export const uploadProductImage = (file: File, folder = 'hero', suffix = 'png') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('suffix', suffix);
  return instance.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
} 