import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { RoleInfo } from '@/types/api'

export const getRoleList = (): Promise<ApiResponse<RoleInfo[]>> => {
  return instance.get('/admin/roles/list/all')
}

export const createRole = (data: { roleName: string; description: string }): Promise<ApiResponse<RoleInfo>> => {
  return instance.post('/admin/roles/create', data)
}

export const updateRole = (id: number, data: { roleName: string; description: string }): Promise<ApiResponse<RoleInfo>> => {
  return instance.put(`/admin/roles/update/${id}`, data)
}

export const deleteRole = (id: number): Promise<ApiResponse<null>> => {
  return instance.get(`/admin/roles/delete/${id}`)
} 