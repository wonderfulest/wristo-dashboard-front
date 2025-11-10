import type { PageQueryDTO, PageResponse, ApiResponse } from './common'

export interface LabelI18nItem {
  long?: string
  short?: string
  medium?: string
}

export type IconRuleType = 'boolean' | 'numeric' | 'enum'

export interface IconRange {
  min?: number
  max?: number
  icon: string
}

export interface IconRules {
  type: IconRuleType
  icons?: Record<string, string>
  ranges?: IconRange[]
}

export interface DataTypeOptionVO {
  id: number
  metricSymbol: string
  category: string
  valueCode: number
  label: string
  labelI18n?: Record<string, LabelI18nItem>
  unit: string
  iconUnicode: string
  defaultValue: string
  isActive: number
  sortOrder: number
  description: string
  iconRules?: IconRules
}

export interface DataTypeOptionCreateDTO {
  metricSymbol: string
  category: string
  valueCode: number
  label: string
  labelI18n?: Record<string, LabelI18nItem>
  unit: string
  iconUnicode: string
  defaultValue: string
  isActive: number
  sortOrder: number
  description: string
  iconRules?: IconRules
}

export interface DataTypeOptionUpdateDTO extends DataTypeOptionCreateDTO {
  id: number
}

export interface DataTypeOptionPageQueryDTO extends PageQueryDTO {
  category?: string
  active?: number
  keyword?: string
}

export type DataTypeOptionPageResp = ApiResponse<PageResponse<DataTypeOptionVO>>
