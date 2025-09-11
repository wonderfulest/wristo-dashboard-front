import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { DbBackupJob, DbBackupStartDTO } from '@/types/ops'

const PREFIX = '/admin/ops/db'

export const startDbBackup = (data: DbBackupStartDTO): Promise<ApiResponse<DbBackupJob>> => {
  return instance.post(`${PREFIX}/backup/start`, data)
}

export const getDbBackup = (id: number): Promise<ApiResponse<DbBackupJob>> => {
  return instance.get(`${PREFIX}/backup/${id}`)
}

export const getRecentDbBackups = (limit = 20): Promise<ApiResponse<DbBackupJob[]>> => {
  return instance.get(`${PREFIX}/backup/recent`, { params: { limit } })
}

// 插入符合条件的产品与指定 bundle 的关系（去重）
export const insertBundleProductRelations = (bundleId: number): Promise<ApiResponse<number>> => {
  return instance.post(`${PREFIX}/bundle/relations/insert`, null, { params: { bundleId } })
}
