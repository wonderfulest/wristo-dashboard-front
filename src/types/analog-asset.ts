/**
 * 指针素材类型枚举
 */
export type AnalogAssetType = 'hour' | 'minute' | 'second' | 'tick12' | 'tick60' | 'romans'

export const AnalogAssetTypeOptions: { value: AnalogAssetType; label: string }[] = [
  { value: 'hour', label: '时针' },
  { value: 'minute', label: '分针' },
  { value: 'second', label: '秒针' },
  { value: 'tick12', label: '12刻度' },
  { value: 'tick60', label: '60刻度' },
  { value: 'romans', label: '罗马数字' }
]

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
export interface AnalogAssetPageQueryDTO {
  pageNum: number
  pageSize: number
  analogAssetType?: AnalogAssetType
  isSystem?: boolean
  isActive?: boolean
  userId?: number
  orderBy?: string
}
