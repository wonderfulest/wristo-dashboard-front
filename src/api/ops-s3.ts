import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

const PREFIX = '/admin/products'

// 删除发布时间已满 15 天的 release S3 压缩包并清空包信息
export const cleanRelease = (): Promise<ApiResponse<boolean>> => {
  return instance.post(`${PREFIX}/release/clean`)
}
