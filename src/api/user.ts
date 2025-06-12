import instance from '@/config/axios'
import type { ApiResponse, UserInfo } from '@/types/api'

export const getUserInfo = (): Promise<ApiResponse<UserInfo>> => {
  return instance.get('/users/info')
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
  return instance.get('/admin/users/list/all')
}

export const getUserDetail = (id: number): Promise<ApiResponse<UserInfo>> => {
  return instance.get(`/admin/users/get/${id}`)
}

export const createUser = (data: { username: string; password: string; email: string; roles?: string[] }): Promise<ApiResponse<UserInfo>> => {
  return instance.post('/admin/users/create', data)
}

export const updateUser = (id: number, data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> => {
  return instance.put(`/admin/users/update/${id}`, data)
}

export const deleteUser = (id: number): Promise<ApiResponse<null>> => {
  return instance.get(`/admin/users/delete/${id}`)
}
