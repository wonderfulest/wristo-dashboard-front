import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface SsoTokenRequestDto {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface SsoTokenResponseData {
  accessToken: string
  expiresIn: number
  refreshToken: string
  tokenType: string
  idToken: string
}

export const fetchSsoToken = (data: SsoTokenRequestDto): Promise<ApiResponse<SsoTokenResponseData>> => {
  return instance.post('/public/sso/token', data)
}