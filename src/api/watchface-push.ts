import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface WatchfacePushSettings {
  enabled: boolean
  sendTime: string
  templateId: string
  source: string
  selectionMode: 'AUTO' | 'MANUAL'
  appId: number | null
}
export interface WatchfacePushHistory {
  pushDay: string; appId: number | null; productName: string | null
  status: string; attempted: number; sent: number; rejected: number; uncertain: number
}
export const getWatchfacePushSettings = (): Promise<ApiResponse<WatchfacePushSettings>> => instance.get('/admin/watchface-push/config')
export const saveWatchfacePushSettings = (data: WatchfacePushSettings): Promise<ApiResponse<WatchfacePushSettings>> => instance.post('/admin/watchface-push/config', data)
export const getWatchfacePushHistory = (): Promise<ApiResponse<WatchfacePushHistory[]>> => instance.get('/admin/watchface-push/history')
