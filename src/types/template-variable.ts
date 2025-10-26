import type { PageQueryDTO } from '@/types/common'

export interface TemplateVariableVO {
  id: number
  variableKey: string
  category: string
  sourceTable: string
  sourceField: string
  joinKey?: string
  label: string
  description?: string
  sampleValue?: string
  dataType: string
  isActive: number
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
  version?: number
}

export interface TemplateVariableQueryDTO extends Partial<PageQueryDTO> {
  category?: string
  dataType?: string
  isActive?: number
  variableKeyLike?: string
}

export interface TemplateVariablePreviewContextDTO {
  userId?: number
  productId?: number
}

export interface TemplateVariableCreateDTO {
  variableKey: string
  category: string
  sourceTable: string
  sourceField: string
  joinKey?: string
  label: string
  description?: string
  sampleValue?: string
  dataType: string
  isActive?: number
  sortOrder?: number
}

export interface TemplateVariableUpdateDTO extends Partial<TemplateVariableCreateDTO> {
  id: number
}
