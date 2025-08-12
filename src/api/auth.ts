import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export const logout = async () : Promise<ApiResponse<string>> => {
  return instance.post('/public/auth/logout')
}
