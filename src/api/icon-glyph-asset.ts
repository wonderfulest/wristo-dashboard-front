import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { IconGlyphAssetVO, IconGlyphAssetPageQueryDTO, IconGlyphAssetPageResp } from '@/types/icon-glyph-asset'

export function getGlyphAssets(glyphId: number): Promise<ApiResponse<IconGlyphAssetVO[]>> {
  return instance.get<ApiResponse<IconGlyphAssetVO[]>, ApiResponse<IconGlyphAssetVO[]>>(
    `/admin/icon-glyph-asset/glyph-assets/${glyphId}?populate=icon,asset,svg_content&displayType=mip`
  )
}

export function bindAssetsToGlyph(glyphId: number, assetId: number): Promise<ApiResponse<IconGlyphAssetVO[]>> {
  return instance.post<
    ApiResponse<IconGlyphAssetVO[]>,
    ApiResponse<IconGlyphAssetVO[]>,
    { assetId: number }
  >(`/admin/icon-glyph-asset/bind-to-glyph/${glyphId}?assetId=${assetId}`)
}

export function pageIconGlyphAsset(dto: IconGlyphAssetPageQueryDTO) {
  return instance.post<IconGlyphAssetPageResp>(
    '/admin/icon-glyph-asset/page?populate=icon,asset',
    dto
  )
}

export function importToGlyph(fromGlyphId: number, toGlyphId: number) {
  return instance.post<ApiResponse<IconGlyphAssetVO[]>>(
    '/admin/icon-glyph-asset/import-to-glyph',
    null,
    { params: { fromGlyphId, toGlyphId } }
  )
}
