import type { PageQueryDTO, PageResponse, ApiResponse } from './common'

export interface IconLibraryVO {
  id: number
  iconUnicode: string
  symbolCode: string
  category: string
  label: string
  isActive: number
}

export interface IconLibraryCreateDTO {
  iconUnicode: string
  symbolCode: string
  category: string
  label: string
  isActive: number
}

export interface IconLibraryUpdateDTO extends IconLibraryCreateDTO {
  id: number
}

export interface IconLibraryPageQueryDTO extends PageQueryDTO {
  category?: string
  active?: number
  keyword?: string
}

export type IconLibraryPageResp = ApiResponse<PageResponse<IconLibraryVO>>
