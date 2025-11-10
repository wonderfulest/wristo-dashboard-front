import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface EnumOption {
  name: string
  value: string
  description?: string
}

export function listEnumOptions(name: string) {
  return instance.get<ApiResponse<EnumOption[]>>('/public/common/enums/options', { params: { name } })
}
