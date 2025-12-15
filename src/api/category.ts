import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { Category, CategoryPageQuery, CategoryPageData, CreateCategoryDto } from '@/types/category'

export const fetchCategoryPage = (params: CategoryPageQuery): Promise<ApiResponse<CategoryPageData>> => {
  return instance.get('/admin/categories/page?populate=image', { params })
}

export const createCategory = (data: CreateCategoryDto): Promise<ApiResponse<Category>> => {
  return instance.post('/admin/categories/create', data)
}

export const getCategory = (id: number): Promise<ApiResponse<Category>> => {
  return instance.get(`/admin/categories/${id}?populate=image`)
}

export const updateCategory = (id: number, data: Partial<Category>): Promise<ApiResponse<Category>> => {
  return instance.post(`/admin/categories/update/${id}`, data)
}

export const deleteCategory = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`/admin/categories/delete/${id}`)
}

export const updateCategoryStatus = (id: number, isActive: number): Promise<ApiResponse<void>> => {
  return instance.post(`/admin/categories/active/${id}/${isActive}`)
}

export const fetchAllCategories = (): Promise<ApiResponse<Category[]>> => {
  return instance.get('/admin/categories/all')
}