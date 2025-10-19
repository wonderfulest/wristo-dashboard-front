import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'

export interface UserProfileVO {
  id: number
  userId?: number
  name?: string
  gender?: string
  age?: number
  country?: string
  city?: string
  interests?: string
  tags?: string
  extJson?: string
  status?: number
  createdAt: string
  updatedAt: string
}

export interface UserProfileCreateDTO {
  userId?: number
  name?: string
  gender?: string
  age?: number
  country?: string
  city?: string
  interests?: string
  tags?: string
  extJson?: string
  status?: number
}

export interface UserProfileUpdateDTO {
  userId?: number
  name?: string
  gender?: string
  age?: number
  country?: string
  city?: string
  interests?: string
  tags?: string
  extJson?: string
  status?: number
}

export interface UserProfilePageQueryDTO {
  pageNum?: number
  pageSize?: number
  orderBy?: string
  userId?: number
  name?: string
  country?: string
  city?: string
  status?: number
}

export const createUserProfile = (data: UserProfileCreateDTO): Promise<ApiResponse<UserProfileVO>> => {
  return instance.post('/admin/user-profile/create', data)
}

export const updateUserProfile = (id: number, data: UserProfileUpdateDTO): Promise<ApiResponse<UserProfileVO>> => {
  return instance.post(`/admin/user-profile/update/${id}`, data)
}

export const getUserProfile = (id: number): Promise<ApiResponse<UserProfileVO>> => {
  return instance.get(`/admin/user-profile/${id}`)
}

export const getUserProfileByUser = (userId: number): Promise<ApiResponse<UserProfileVO>> => {
  return instance.get(`/admin/user-profile/by-user/${userId}`)
}

export const deleteUserProfile = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`/admin/user-profile/delete/${id}`)
}

export const pageUserProfiles = (dto: UserProfilePageQueryDTO): Promise<ApiResponse<PageResponse<UserProfileVO>>> => {
  return instance.post('/admin/user-profile/page', dto)
}
