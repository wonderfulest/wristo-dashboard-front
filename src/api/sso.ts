import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { SsoTokenRequestDto, SsoTokenResponseData } from '@/types/sso'

export const fetchSsoToken = (data: SsoTokenRequestDto): Promise<ApiResponse<SsoTokenResponseData>> => {
  return instance.post('/public/sso/token', data)
}