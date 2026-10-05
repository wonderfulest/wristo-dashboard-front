import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export type AiScene = 'TAGS' | 'DESCRIPTION' | 'BANNER' | 'WATCHFACE' | 'WATCHFACE_ADJUST'
export interface AiModel {
  id: string
  provider: 'BAILIAN' | 'OPENAI'
  model: string
  capability: 'TEXT' | 'IMAGE'
  enabled: boolean
}
export interface AiSettings {
  enabled: boolean
  models: AiModel[]
  scenes: Record<AiScene, { enabled: boolean; modelId: string; creditCost: number }>
}
export interface AiAdminView {
  settings: AiSettings
  credentials: Record<string, boolean>
  active: boolean
}
export const getStudioAi = (): Promise<ApiResponse<AiAdminView>> => instance.get('/admin/studio-ai')
export const saveStudioAi = (settings: AiSettings): Promise<ApiResponse<AiAdminView>> => instance.put('/admin/studio-ai', settings)
