import type { PageQueryDTO } from './common'
import type { ImageVO } from './image'
import type { ProductBase } from './product'

export interface ThemeRuleVO {
  id: number
  appId: number
  ruleType: string
  ruleCalculation: string
  active: number
  createdAt?: string
  updatedAt?: string
  product?: ProductBase
}

export interface ThemeRulePageRequest extends PageQueryDTO {
  appId?: number
  ruleType?: string
  active?: number
}

export interface ThemeRuleUpsertDTO {
  appId: number
  ruleType: string
  ruleCalculation: string
  active: number
}

export interface RuleConfigVO {
  ruleType?: string
  output?: {
    key?: string
    format?: string
    values?: string[]
  }
  slots?: Array<{
    name?: string
    range?: string
  }>
  input?: {
    source?: string
  }
  mapping?: Record<string, string[]>
}

export interface ThemeConfigVO {
  id: number
  appId: number
  key: string
  value: string
  imageId: number
  colorJson?: string | null
  weight?: number | null
  priority?: number | null
  active: number
  createdAt?: string
  updatedAt?: string
  image?: ImageVO
  product?: ProductBase
}

export interface ThemeConfigPageRequest extends PageQueryDTO {
  appId?: number
  key?: string
  value?: string
  active?: number
}

export interface ThemeConfigUpsertDTO {
  appId: number
  key: string
  value: string
  imageId: number
  colorJson?: string
  weight?: number
  priority?: number
  active: number
}
