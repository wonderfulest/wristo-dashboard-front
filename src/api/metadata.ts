import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface TableColumn {
  field: string
  type: string
  comment: string
}

export const getUserProfileColumns = (): Promise<ApiResponse<TableColumn[]>> => {
  return instance.get('/admin/metadata/user-profile/columns')
}
