import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { FontGlyphVO, FontGlyphPageQueryDTO } from '@/types/font-glyph'

export function pageFontGlyph(dto: FontGlyphPageQueryDTO) {
  return instance.post<ApiResponse<PageResponse<FontGlyphVO>>>('/admin/font-glyph/page?populate=*', dto)
}

export function getFontGlyph(id: number) {
  return instance.get<ApiResponse<FontGlyphVO>>(`/admin/font-glyph/get/${id}`)
}

export function removeFontGlyph(id: number) {
  return instance.post<ApiResponse<boolean>>(`/admin/font-glyph/remove/${id}`)
}

export function getFontGlyphByGlyphCode(glyphCode: string) {
  return instance.post<ApiResponse<FontGlyphVO>>(`/admin/font-glyph/get-glyph-by-glyph-code/${glyphCode}`)
}

export function buildFontGlyph(glyphCode: string) {
  return instance.post<ApiResponse<FontGlyphVO>>('/admin/font-glyph/build-font-glyph', null, {
    params: { glyphCode }
  })
}
