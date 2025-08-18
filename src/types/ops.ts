export interface DbBackupStartDTO {
  dbType?: string // mysql/postgres
  backupType?: string // FULL/INCREMENTAL
  storagePath?: string // 目录或URL
  fileName?: string // 可选
  operator?: string // 操作人
}

export interface DbBackupJob {
  id: number
  dbType: string
  backupType: string
  storagePath: string
  fileName: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | string
  message: string
  operator: string
  createdAt: string
  updatedAt: string
  startedAt: string
  finishedAt: string
  isDeleted: number
}
