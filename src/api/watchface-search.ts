import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type {
  WatchfaceSearchRebuildVO,
  WatchfaceSearchStatusVO,
  WatchfaceIndexConsistencyVO,
  WatchfaceSearchDocVO,
} from '@/types/watchface-search'

const BASE = '/admin/products/watchface-search'

export function rebuildAll(clear = true): Promise<ApiResponse<WatchfaceSearchRebuildVO>> {
  return instance.post(`${BASE}/rebuild?clear=${clear}`)
}

export function rebuildOne(id: number): Promise<ApiResponse<boolean>> {
  return instance.post(`${BASE}/rebuild/${id}`)
}

export function rebuildBatch(ids: number[]): Promise<ApiResponse<boolean>> {
  return instance.post(`${BASE}/rebuild/batch`, ids)
}

export function fetchStatus(): Promise<ApiResponse<WatchfaceSearchStatusVO>> {
  return instance.get(`${BASE}/status`)
}

export function fetchCount(): Promise<ApiResponse<number>> {
  return instance.get(`${BASE}/count`)
}

export function searchDocs(keyword: string, limit = 10): Promise<ApiResponse<WatchfaceSearchDocVO[]>> {
  return instance.get(`${BASE}/search`, { params: { keyword, limit } })
}

export function getDoc(watchfaceId: number): Promise<ApiResponse<WatchfaceSearchDocVO | null>> {
  return instance.get(`${BASE}/doc/${watchfaceId}`)
}

export function deleteDoc(watchfaceId: number): Promise<ApiResponse<boolean>> {
  return instance.delete(`${BASE}/doc/${watchfaceId}`)
}

export function checkConsistency(sampleLimit = 200): Promise<ApiResponse<WatchfaceIndexConsistencyVO>> {
  return instance.get(`${BASE}/check/consistency`, { params: { sampleLimit } })
}

export function reloadSettings(): Promise<ApiResponse<boolean>> {
  return instance.post(`${BASE}/settings/reload`)
}

export function switchIndex(enabled: boolean): Promise<ApiResponse<boolean>> {
  return instance.post(`${BASE}/switch?enabled=${enabled}`)
}
