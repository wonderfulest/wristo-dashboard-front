import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

const PREFIX = '/admin/products'

// 清理历史 release 压缩包
export const cleanRelease = (): Promise<ApiResponse<boolean>> => {
  return instance.post(`${PREFIX}/release/clean`)
}
