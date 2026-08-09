import type { ApiResponse, PageQueryDTO, PageResponse } from './common'
import type { LocalizedText } from './data-type-option'

export interface DataUnitVariant {
  aliases: string[]
  label: LocalizedText
}

export interface DataUnitDefinitionFields {
  unitKey: string
  name: string
  defaultVariant: string | null
  variants: Record<string, DataUnitVariant>
  isActive: number
  sortOrder: number
  description: string
}

export interface DataUnitDefinitionVO extends DataUnitDefinitionFields {
  id: number
  referenceCount: number
  createdAt?: string
  updatedAt?: string
  version?: number
}

export type DataUnitDefinitionCreateDTO = DataUnitDefinitionFields

export interface DataUnitDefinitionUpdateDTO extends Partial<DataUnitDefinitionFields> {
  id: number
}

export interface DataUnitDefinitionPageQueryDTO extends PageQueryDTO {
  active?: number
  keyword?: string
}

export type DataUnitDefinitionPageResp = ApiResponse<PageResponse<DataUnitDefinitionVO>>
