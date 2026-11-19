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
  taskId: string; createdAt: string; pushDay: string; appId: number | null; productName: string | null
  status: string; attempted: number; sent: number; rejected: number; uncertain: number
}
export const getWatchfacePushSettings = (): Promise<ApiResponse<WatchfacePushSettings>> => instance.get('/admin/watchface-push/config')
export const saveWatchfacePushSettings = (data: WatchfacePushSettings): Promise<ApiResponse<WatchfacePushSettings>> => instance.post('/admin/watchface-push/config', data)
export const getWatchfacePushHistory = (): Promise<ApiResponse<WatchfacePushHistory[]>> => instance.get('/admin/watchface-push/history')

export const sendWatchfacePushNow = (requestId: string, config: WatchfacePushSettings): Promise<ApiResponse<{ requestId: string }>> => instance.post('/admin/watchface-push/send-now', { requestId, config })

export interface WatchfacePushCalendarTask extends WatchfacePushHistory { config: WatchfacePushSettings }
export const getWatchfacePushCalendar = (month: string): Promise<ApiResponse<WatchfacePushCalendarTask[]>> => instance.get('/admin/watchface-push/calendar', { params: { month } })

export const saveWatchfacePushPlan = (day: string, config: WatchfacePushSettings): Promise<ApiResponse<void>> => instance.put(`/admin/watchface-push/calendar/${day}`, config)
export const cancelWatchfacePushPlan = (day: string): Promise<ApiResponse<void>> => instance.delete(`/admin/watchface-push/calendar/${day}`)
