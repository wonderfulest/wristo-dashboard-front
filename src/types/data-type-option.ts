import type { PageQueryDTO, PageResponse, ApiResponse } from './common'

export type LabelI18n = Record<string, string>

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
  value?: number
  label: string
  labelI18n?: LabelI18n
  labelCn?: string
  enLabel?: string
  displayLabel?: string
  unit: string
  iconUnicode: string
  icon?: string
  stringKey?: string
  defaultValue: string
  isActive: number
  sortOrder: number
  description: string
  iconRules?: IconRules
  dialMode?: 'goal' | 'range' | null
  dialMin?: number | null
  dialMax?: number | null
  dialGoalSource?: 'garmin' | 'fixed' | null
}

export interface DataTypeOptionCreateDTO {
  metricSymbol: string
  category: string
  valueCode: number
  label: string
  labelI18n?: LabelI18n
  unit: string
  iconUnicode: string
  defaultValue: string
  isActive: number
  sortOrder: number
  description: string
  iconRules?: IconRules
  dialMode?: 'goal' | 'range' | null
  dialMin?: number | null
  dialMax?: number | null
  dialGoalSource?: 'garmin' | 'fixed' | null
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
