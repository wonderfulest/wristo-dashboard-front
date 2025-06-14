import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface Category {
  id: number
  name: string
  slug: string
  image: string | null
  sort: number
  isActive: number
}

export interface CategoryPageQuery {
  pageNum: number
  pageSize: number
  orderBy?: string
}

export interface CategoryPageData {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  list: Category[]
}

export const fetchCategoryPage = (params: CategoryPageQuery): Promise<ApiResponse<CategoryPageData>> => {
  return instance.get('/categories/page', { params })
}

export const fetchAllCategories = (): Promise<ApiResponse<Category[]>> => {
  return instance.get('/categories/all')
}

// 新增分类
export interface CreateCategoryDto {
  name: string
  slug: string
  image?: string
  sort?: number
}

export const createCategory = (data: CreateCategoryDto): Promise<ApiResponse<Category>> => {
  return instance.post('/admin/categories/create', data)
}

// 查询单个分类
export const getCategory = (id: number): Promise<ApiResponse<Category>> => {
  return instance.get(`/admin/categories/${id}`)
}

// 更新分类
export const updateCategory = (id: number, data: Partial<Category>): Promise<ApiResponse<Category>> => {
  return instance.post(`/admin/categories/update/${id}`, data)
}

// 删除分类
export const deleteCategory = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`/admin/categories/delete/${id}`)
} 