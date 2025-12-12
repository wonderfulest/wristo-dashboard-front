import { PageQueryDTO } from './common'
import type { UserBase } from './user'

/**
 * 指针素材类型枚举
 */
export type AnalogAssetType = 'hour' | 'minute' | 'second' | 'tick12' | 'tick60' | 'romans'

/**
 * 设计状态枚举
 */
// 已移除设计状态枚举

/**
 * 指针素材 VO
 */
export interface FileVO {
  id: number
  name: string
  url: string
  previewUrl?: string
  provider?: string
}

export interface AnalogAssetVO {
  id: number
  analogAssetType: AnalogAssetType
  fileId: number
  userId: number
  isSystem: boolean
  isDeleted: boolean
  version: number
  isActive: boolean
  /** 可选填充的文件信息 */
  file?: FileVO
  author?: UserBase
}

/**
 * 创建指针素材 DTO
 */
export interface AnalogAssetCreateDTO {
  analogAssetType: AnalogAssetType
  fileId: number
  isSystem?: boolean
  isDeleted?: boolean
  isActive?: boolean
}

/**
 * 更新指针素材 DTO
 */
export interface AnalogAssetUpdateDTO {
  id: number
  analogAssetType?: AnalogAssetType
  fileId?: number
  isSystem?: boolean
  isDeleted?: boolean
  isActive?: boolean
}

/**
 * 指针素材分页查询 DTO
 */
export interface AnalogAssetPageQueryDTO extends PageQueryDTO {
  analogAssetType?: AnalogAssetType
  isSystem?: boolean
  isActive?: boolean
  userId?: number
}
