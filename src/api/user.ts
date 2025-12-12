import instance from '@/config/axios'
import type { ApiResponse, UserInfo, PageResponse } from '@/types/api'
import type { UserUpdateDTO } from '@/types/user'
import type { ChangeUserEmailDTO } from '@/types/user'
import type { PageQueryDTO } from '@/types/api'

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
export interface UserPageQueryDTO extends PageQueryDTO {
  username?: string
  roleId?: number
  email?: string
}

export const pageUsers = (dto: UserPageQueryDTO): Promise<ApiResponse<PageResponse<UserInfo>>> => {
  return instance.post('/admin/users/page?populate=roles', dto)
}

// 商家用户分页（固定按商家角色筛选）
export const MERCHANT_ROLE_ID = 3

export interface MerchantUserPageQueryDTO extends PageQueryDTO {
  username?: string
  email?: string
}

export const pageMerchantUsers = (
  dto: MerchantUserPageQueryDTO
): Promise<ApiResponse<PageResponse<UserInfo>>> => {
  return instance.post('/admin/users/page?populate=roles', {
    ...dto,
    roleId: MERCHANT_ROLE_ID,
  })
}

export const searchUsers = (
  keyword: string,
  limit?: number
): Promise<ApiResponse<UserInfo[]>> => {
  return instance.get('/admin/users/search', {
    params: {
      keyword,
      limit,
    },
  })
}

// 同步 Paddle Customers
export interface SyncPaddleCustomersResult {
  after?: string
  created: number
}

export const syncPaddleCustomers = (
  params: { after?: string; perPage?: number; pages?: number } = {}
): Promise<ApiResponse<SyncPaddleCustomersResult>> => {
  const search = new URLSearchParams()
  if (params.after) search.append('after', params.after)
  if (typeof params.perPage === 'number') search.append('perPage', String(params.perPage))
  if (typeof params.pages === 'number') search.append('pages', String(params.pages))
  const q = search.toString()
  const url = q ? `/admin/users/sync/paddle/customers?${q}` : '/admin/users/sync/paddle/customers'
  return instance.post(url)
}

export const changeUserEmail = (dto: ChangeUserEmailDTO): Promise<ApiResponse<UserInfo>> => {
  return instance.post('/admin/users/change/email', dto)
}
