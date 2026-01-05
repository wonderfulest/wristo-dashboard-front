import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { GlobalConfig, GlobalConfigHistory } from '@/types/ops'

// GET /admin/config?category=...
export const listConfigs = (category?: string): Promise<ApiResponse<GlobalConfig[]>> => {
  const params = category ? { category } : undefined
  return instance.get('/admin/config', { params })
}

// GET /admin/config/{configKey}?category=...
export const getConfig = (configKey: string, category?: string): Promise<ApiResponse<GlobalConfig>> => {
  const params = category ? { category } : undefined
  return instance.get(`/admin/config/${encodeURIComponent(configKey)}`, { params })
}

// POST /admin/config/{configKey}
// body: { category?: string, config_value: string, description?: string }
export const upsertConfig = (
  configKey: string,
  body: { category?: string; config_value: string; description?: string | null }
): Promise<ApiResponse<GlobalConfig>> => {
  return instance.post(`/admin/config/${encodeURIComponent(configKey)}`, body)
}

// GET /admin/config/{configKey}/history?category=...
export const getConfigHistory = (
  configKey: string,
  category: string
): Promise<ApiResponse<GlobalConfigHistory[]>> => {
  return instance.get(`/admin/config/${encodeURIComponent(configKey)}/history`, { params: { category } })
}

// POST /admin/config/{configKey}/activate?isActive=true|false
export const activateConfig = (
  configKey: string,
  isActive: boolean
): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/config/activate/toggle`, null, {
    params: { configKey, isActive }
  })
}

// ---------------- Review Time helpers ----------------
// GET /admin/config/review_time
export const getReviewTime = (): Promise<ApiResponse<GlobalConfig>> => {
  return instance.get('/admin/config/review_time')
}

// POST /admin/config/review_time { config_value }
export const setReviewTime = (config_value: string, description?: string): Promise<ApiResponse<GlobalConfig>> => {
  return instance.post('/admin/config/review_time', { config_value, description })
}

// Refresh by setting to current system time via setReviewTime
export const refreshReviewTime = (): Promise<ApiResponse<GlobalConfig>> => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const now = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return setReviewTime(now, '作品审核时间点')
}
