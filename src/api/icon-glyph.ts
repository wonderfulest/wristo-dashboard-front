import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { PageResponse } from '@/types/api'
import type {
  IconGlyphVO,
  IconGlyphCreateDTO,
  IconGlyphUpdateDTO,
  IconGlyphPageQueryDTO
} from '@/types/icon-glyph'

export function createIconGlyph(dto: IconGlyphCreateDTO) {
  return instance.post<ApiResponse<IconGlyphVO>>('/admin/icon-glyph/create', dto)
}

export function updateIconGlyph(id: number, dto: Partial<IconGlyphUpdateDTO>) {
  return instance.post<ApiResponse<IconGlyphVO>>(`/admin/icon-glyph/update/${id}`, dto)
}

export function removeIconGlyph(id: number) {
  return instance.post<ApiResponse<boolean>>(`/admin/icon-glyph/remove/${id}`)
}

export function getIconGlyph(id: number) {
  return instance.get<ApiResponse<IconGlyphVO>>(`/admin/icon-glyph/get/${id}`)
}

export function listGlyphsByIcon(iconId: number) {
  return instance.get<ApiResponse<IconGlyphVO[]>>(`/admin/icon-glyph/list-by-icon/${iconId}`)
}

export function pageIconGlyph(dto: IconGlyphPageQueryDTO) {
  return instance.post<ApiResponse<PageResponse<IconGlyphVO>>>(
    '/admin/icon-glyph/page',
    dto
  )
}

export function listGlyphStyles() {
  return instance.get<ApiResponse<string[]>>('/admin/icon-glyph/styles')
}
