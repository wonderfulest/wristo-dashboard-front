import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type {
  IconLibraryVO,
  IconLibraryCreateDTO,
  IconLibraryUpdateDTO,
  IconLibraryPageQueryDTO
} from '@/types/icon-library'

export function createIconLibrary(dto: IconLibraryCreateDTO) {
  return instance.post<ApiResponse<IconLibraryVO>>('/admin/icon-library/create', dto)
}

export function updateIconLibrary(id: number, dto: Partial<IconLibraryUpdateDTO>) {
  return instance.post<ApiResponse<IconLibraryVO>>(`/admin/icon-library/update/${id}`, dto)
}

export function removeIconLibrary(id: number) {
  return instance.post<ApiResponse<boolean>>(`/admin/icon-library/remove/${id}`)
}

export function getIconLibrary(id: number) {
  return instance.get<ApiResponse<IconLibraryVO>>(`/admin/icon-library/get/${id}`)
}

export function getIconLibraryBySymbol(code: string) {
  return instance.get<ApiResponse<IconLibraryVO>>(`/admin/icon-library/get-by-symbol/${code}`)
}

export function listIconLibrary(category?: string) {
  const params = category ? { category } : undefined
  return instance.get<ApiResponse<IconLibraryVO[]>>('/admin/icon-library/list', { params })
}

export function pageIconLibrary(dto: IconLibraryPageQueryDTO) {
  return instance.post('/admin/icon-library/page', dto)
}
