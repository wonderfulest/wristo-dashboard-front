import instance from '@/config/axios'
import type { ApiResponse, UserInfo } from '@/types/api'

export const logout = async () : Promise<ApiResponse<string>> => {
  return instance.post('/public/auth/logout')
}

export const getUserInfo = () : Promise<ApiResponse<UserInfo>> => {
  return instance.get('/users/info')
}
