import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface IOSWatchfacePushSettings {
  templateId?: string
  messages?: Record<string, IOSPushMessage>
  enabled: boolean
  sendTime: string
  title: string
  body: string
  appId: number | null
}
export interface IOSWatchfacePushHistory {
  sendMode: string
  contentJson: string | null
  pushDay: string
  appId: number | null
  productName: string | null
  status: string
  attempted: number
  sent: number
  rejected: number
  uncertain: number
  clicked: number
}
export interface IOSPushDevice {
  id: number
  installationId: string
  environment: string
  language: string
  timeZone: string
  updatedAt: string
}
const path = '/admin/ios-watchface-push'
export const getIOSPushStatus = (): Promise<ApiResponse<{ configured: boolean }>> => instance.get(`${path}/status`)
export const getIOSPushConfig = (): Promise<ApiResponse<IOSWatchfacePushSettings>> => instance.get(`${path}/config`)
export const saveIOSPushConfig = (data: IOSWatchfacePushSettings): Promise<ApiResponse<IOSWatchfacePushSettings>> => instance.post(`${path}/config`, data)
export const getIOSPushHistory = (): Promise<ApiResponse<IOSWatchfacePushHistory[]>> => instance.get(`${path}/history`)
export const getIOSPushDevices = (): Promise<ApiResponse<IOSPushDevice[]>> => instance.get(`${path}/devices`)
export const sendIOSPushTest = (deviceId: number, appId: number, config?: IOSWatchfacePushSettings): Promise<ApiResponse<{ status: string }>> => instance.post(`${path}/test`, { deviceId, appId, config })

export interface IOSPushMessage { title: string; body: string }
export interface IOSPushTemplate { id: string; name: string; messages: Record<string, IOSPushMessage> }
export interface IOSImmediateTask { id: string; appId: number; productName: string; status: string; createdAt: string; contentJson: string }
export const getIOSPushTemplates = (): Promise<ApiResponse<IOSPushTemplate[]>> => instance.get(`${path}/templates`)
export const previewIOSPush = (data: IOSWatchfacePushSettings): Promise<ApiResponse<{ productName: string; messages: Record<string, IOSPushMessage> }>> => instance.post(`${path}/preview`, data)
export const sendIOSPushNow = (requestId: string, config: IOSWatchfacePushSettings): Promise<ApiResponse<{ requestId: string }>> => instance.post(`${path}/send-now`, { requestId, config })
export const getIOSImmediateHistory = (): Promise<ApiResponse<IOSImmediateTask[]>> => instance.get(`${path}/immediate-history`)
