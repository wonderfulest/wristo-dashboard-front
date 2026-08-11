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
  nodeIp?: string
  createdAt: string
  updatedAt: string
  startedAt: string
  finishedAt: string
  isDeleted: number
}

export interface DbBackupFile {
  key: string
  fileName: string
  size: number
  lastModified: string
  eTag?: string
}

export interface DbBackupDownload {
  url: string
  expiresInSeconds: number
}

// ---------------- Global Config ----------------
export type GlobalConfigCategoryCode = 'audit' | 'frontend' | 'business' | 'system' | 'thirdparty'

export interface GlobalConfig {
  id: number
  category: GlobalConfigCategoryCode
  configKey: string
  configValue: string
  description?: string | null
  updatedBy?: string | null
  isActive?: boolean
  isDeleted?: boolean
  createdAt: string
  updatedAt: string
  version?: number
}

export interface GlobalConfigHistory {
  id: number
  category: GlobalConfigCategoryCode
  configKey: string
  oldValue?: string | null
  newValue?: string | null
  description?: string | null
  updatedBy?: string | null
  createdAt: string
  version?: number
}
