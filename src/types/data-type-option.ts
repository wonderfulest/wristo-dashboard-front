import type { PageQueryDTO, PageResponse, ApiResponse } from './common'

export interface DataTypeOptionVO {
  id: number
  metricSymbol: string
  category: string
  valueCode: number
  label: string
  labelCn: string
  unit: string
  iconUnicode: string
  defaultValue: string
  enLabelShort: string
  enLabelMedium: string
  enLabelLong: string
  isActive: number
  sortOrder: number
  description: string
}

export interface DataTypeOptionCreateDTO {
  metricSymbol: string
  category: string
  valueCode: number
  label: string
  labelCn: string
  unit: string
  iconUnicode: string
  defaultValue: string
  enLabelShort: string
  enLabelMedium: string
  enLabelLong: string
  isActive: number
  sortOrder: number
  description: string
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
