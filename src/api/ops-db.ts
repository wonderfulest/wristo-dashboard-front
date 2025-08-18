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
