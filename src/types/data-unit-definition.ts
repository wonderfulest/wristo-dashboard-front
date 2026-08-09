import type { ApiResponse, PageQueryDTO, PageResponse } from './common'
import type { LocalizedText } from './data-type-option'

export interface DataUnitVariant {
  aliases: string[]
  label: LocalizedText
}

export type DataUnitSelectionPolicy =
  | { type: 'none' }
  | { type: 'fixed'; variant: string }
  | {
      type: 'deviceSetting'
      setting: 'distanceUnits' | 'temperatureUnits'
      mapping: { metric: string; statute: string }
    }
  | { type: 'provider'; fallbackVariant?: string }

export interface DataUnitDefinitionFields {
  unitKey: string
  name: string
  defaultVariant: string | null
  selectionPolicy: DataUnitSelectionPolicy
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
