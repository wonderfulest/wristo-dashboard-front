import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export const TOKEN_NAME = 'merchant-api-token'
export interface TokenData {
  id: number
  token: string
  userId: number
  name: string
  lastUsedAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  version: number
  isDeleted: boolean
}

export const createOrUpdateToken = async (name: string): Promise<ApiResponse<TokenData>> => {
  return instance.post('/v1/tokens/create-or-update', { name })
}

export const getToken = async (): Promise<ApiResponse<TokenData>> => {
  return instance.get('/v1/tokens/get-by-name', { params: { name: TOKEN_NAME } })
}