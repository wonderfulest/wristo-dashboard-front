import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  DataUnitDefinitionCreateDTO,
  DataUnitDefinitionPageQueryDTO,
  DataUnitDefinitionUpdateDTO,
  DataUnitDefinitionVO,
} from '@/types/data-unit-definition'

export function createDataUnit(dto: DataUnitDefinitionCreateDTO) {
  return instance.post<ApiResponse<DataUnitDefinitionVO>>('/admin/data-units/create', dto)
}

export function updateDataUnit(id: number, dto: Partial<DataUnitDefinitionUpdateDTO>) {
  return instance.post<ApiResponse<DataUnitDefinitionVO>>(`/admin/data-units/update/${id}`, dto)
}

export function removeDataUnit(id: number) {
  return instance.post<ApiResponse<boolean>>(`/admin/data-units/remove/${id}`)
}

export function getDataUnit(id: number) {
  return instance.get<ApiResponse<DataUnitDefinitionVO>>(`/admin/data-units/get/${id}`)
}

export function listDataUnits(active?: number): Promise<ApiResponse<DataUnitDefinitionVO[]>> {
  return instance.get<ApiResponse<DataUnitDefinitionVO[]>>('/admin/data-units/list', {
    params: active === undefined ? undefined : { active },
  }) as unknown as Promise<ApiResponse<DataUnitDefinitionVO[]>>
}

export function pageDataUnits(
  dto: DataUnitDefinitionPageQueryDTO,
): Promise<ApiResponse<PageResponse<DataUnitDefinitionVO>>> {
  return instance.post('/admin/data-units/page', dto)
}
