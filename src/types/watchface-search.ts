export interface WatchfaceSearchRebuildVO {
  cleared?: boolean
  total?: number
  indexed?: number
  message?: string
}

export interface WatchfaceSearchStatusVO {
  indexName?: string
  docCount?: number
  lastRebuildTime?: string
  health?: string
  settings?: WatchfaceSearchSettingsVO | null
}

// 后端有 WatchfaceSearchSettingsVO，这里先用 any 占位，后续如需要再细化
export type WatchfaceSearchSettingsVO = any

export interface WatchfaceIndexConsistencyVO {
  dbCount?: number
  indexCount?: number
  missingIds?: number[]
  extraIds?: number[]
}

export interface WatchfaceSearchDocVO {
  id: number
  name?: string
  tags?: string[]
  scene?: string[]
  desc?: string
  category?: string
  locale?: string[]
  downloads?: number
  rating?: number
  updatedAt?: number
}
