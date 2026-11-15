import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface IOSWatchfacePushSettings {
  enabled: boolean
  sendTime: string
  title: string
  body: string
  appId: number | null
}
export interface IOSWatchfacePushHistory {
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
export const sendIOSPushTest = (deviceId: number, appId: number): Promise<ApiResponse<{ status: string }>> => instance.post(`${path}/test`, { deviceId, appId })
