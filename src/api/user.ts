import instance from '@/config/axios'
import type { ApiResponse, UserInfo, PageResponse } from '@/types/api'
import type { UserUpdateDTO } from '@/types/user'

export const getUserInfo = (): Promise<ApiResponse<UserInfo>> => {
  return instance.get('/users/info?populate=roles')
}

export const updateUserInfo = (data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> => {
  return instance.post('/users/update/my-info', data)
}

export const uploadAvatar = (file: File): Promise<ApiResponse<string>> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'merchant/avatar')
  formData.append('suffix', file.name.split('.').pop() || 'png')
  return instance.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getUserList = (): Promise<ApiResponse<UserInfo[]>> => {
  return instance.get('/admin/users/list/all?populate=roles')
}

export const getUserDetail = (id: number): Promise<ApiResponse<UserInfo>> => {
  return instance.get(`/admin/users/get/${id}`)
}

export const createUser = (data: { username: string; password: string; email: string; roles?: string[] }): Promise<ApiResponse<UserInfo>> => {
  return instance.post('/admin/users/create', data)
}

export const updateUser = (id: number, data: UserUpdateDTO): Promise<ApiResponse<UserInfo>> => {
  return instance.post(`/admin/users/update/${id}`, data)
}

export const deleteUser = (id: number): Promise<ApiResponse<null>> => {
  return instance.get(`/admin/users/delete/${id}`)
}

// 分页查询用户
export interface UserPageQueryDTO {
  pageNum: number
  pageSize: number
  orderBy?: string
  username?: string
  roleId?: number
}

export const pageUsers = (dto: UserPageQueryDTO): Promise<ApiResponse<PageResponse<UserInfo>>> => {
  return instance.post('/admin/users/page?populate=roles', dto)
}
