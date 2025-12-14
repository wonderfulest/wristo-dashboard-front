import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  InspirationVO,
  InspirationCreateDTO,
  InspirationUpdateDTO,
  InspirationPageQueryDTO
} from '@/types/inspiration'

export function createInspiration(dto: InspirationCreateDTO) {
  return instance.post<ApiResponse<InspirationVO>>('/admin/inspiration/create', dto)
}

export function updateInspiration(id: number, dto: Partial<InspirationUpdateDTO>) {
  return instance.post<ApiResponse<InspirationVO>>(`/admin/inspiration/update/${id}`, dto)
}

export function removeInspiration(id: number) {
  return instance.post<ApiResponse<boolean>>(`/admin/inspiration/remove/${id}`)
}

export function getInspiration(id: number) {
  return instance.get<ApiResponse<InspirationVO>>(`/admin/inspiration/get/${id}?populate=asset,author`)
}

export function pageInspirations(dto: InspirationPageQueryDTO) {
  return instance.post<ApiResponse<PageResponse<InspirationVO>>>(
    '/admin/inspiration/page?populate=asset,author',
    dto
  )
}
