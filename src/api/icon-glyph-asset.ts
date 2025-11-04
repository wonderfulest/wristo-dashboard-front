import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { IconGlyphAssetVO } from '@/types/icon-glyph-asset'

export function getGlyphAssets(glyphId: number): Promise<ApiResponse<IconGlyphAssetVO[]>> {
  return instance.get<ApiResponse<IconGlyphAssetVO[]>, ApiResponse<IconGlyphAssetVO[]>>(
    `/admin/icon-glyph-asset/glyph-assets/${glyphId}`
  )
}

export function bindAssetsToGlyph(glyphId: number, assetIds: number[]): Promise<ApiResponse<IconGlyphAssetVO[]>> {
  return instance.post<
    ApiResponse<IconGlyphAssetVO[]>,
    ApiResponse<IconGlyphAssetVO[]>,
    number[]
  >(`/admin/icon-glyph-asset/bind-to-glyph/${glyphId}`, assetIds)
}
