import type { AnalogAssetPageQueryDTO, AnalogAssetType } from '../../types/analog-asset'

type BooleanFilter = '' | 'true' | 'false'

export interface AnalogAssetPageQueryInput {
  pageNum: number
  pageSize: number
  analogAssetType: AnalogAssetType | ''
  userId?: number
  isSystem: BooleanFilter
  isShared: BooleanFilter
  isActive: BooleanFilter
  orderBy: string
}

export function buildAnalogAssetPageQuery(input: AnalogAssetPageQueryInput): AnalogAssetPageQueryDTO
