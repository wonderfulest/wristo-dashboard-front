import type { PageQueryDTO, PageResponse, ApiResponse } from './common'

export interface LocalizedText {
  eng: string
  zhs: string
}

export interface DataLabel {
  eng: { short: string; medium: string; long: string }
  zhs: string
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

export type DataTypeCategory = 'field' | 'goal' | 'chart' | 'indicator' | 'date'
export type DialMode = 'goal' | 'range' | 'direction' | null
export type DialGoalSource = 'garmin' | null
export type DialDirectionUnit = 'degree' | null

export interface DataTypeOptionFields {
  metricSymbol: string
  category: DataTypeCategory
  valueCode: number
  settingsLabel: LocalizedText
  label: DataLabel
  unitKey: string
  iconUnicode: string
  defaultValue: string
  isActive: number
  systemDefault: number
  sortOrder: number
  description: string
  iconRules?: IconRules
  dialMode?: DialMode
  dialMin?: number | null
  dialMax?: number | null
  dialGoalSource?: DialGoalSource
  dialDirectionUnit?: DialDirectionUnit
}

export interface DataTypeOptionVO extends DataTypeOptionFields {
  id: number
}

export type DataTypeOptionCreateDTO = DataTypeOptionFields

export interface DataTypeOptionUpdateDTO extends Partial<DataTypeOptionFields> {
  id: number
}

export interface DataTypeOptionPageQueryDTO extends PageQueryDTO {
  category?: string
  active?: number
  systemDefault?: number
  keyword?: string
}

export type DataTypeOptionPageResp = ApiResponse<PageResponse<DataTypeOptionVO>>
