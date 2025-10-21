import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  DataTypeOptionVO,
  DataTypeOptionCreateDTO,
  DataTypeOptionUpdateDTO,
  DataTypeOptionPageQueryDTO
} from '@/types/data-type-option'

export function createDataTypeOption(dto: DataTypeOptionCreateDTO) {
  return instance.post<ApiResponse<DataTypeOptionVO>>('/admin/data-type-options/create', dto)
}

export function updateDataTypeOption(id: number, dto: Partial<DataTypeOptionUpdateDTO>) {
  return instance.post<ApiResponse<DataTypeOptionVO>>(`/admin/data-type-options/update/${id}`, dto)
}

export function removeDataTypeOption(id: number) {
  return instance.post<ApiResponse<boolean>>(`/admin/data-type-options/remove/${id}`)
}

export function getDataTypeOption(id: number) {
  return instance.get<ApiResponse<DataTypeOptionVO>>(`/admin/data-type-options/get/${id}`)
}

export function getDataTypeOptionBySymbol(symbol: string) {
  return instance.get<ApiResponse<DataTypeOptionVO>>(`/admin/data-type-options/get-by-symbol/${symbol}`)
}

export function pageDataTypeOptions(dto: DataTypeOptionPageQueryDTO) {
  return instance.post<ApiResponse<PageResponse<DataTypeOptionVO>>>('/admin/data-type-options/page', dto)
}
