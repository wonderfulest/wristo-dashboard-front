import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface GarminPushMessage {
  id: number
  status: string
  attempts: number
  receivedAt: string
  availableAt: string
  summary: Record<string, number> | null
  payloadAvailable: boolean
}
export interface GarminPushDetail {
  message: GarminPushMessage
  payload: string | null
  payloadState: 'AVAILABLE' | 'CLEARED' | 'UNREADABLE'
}
export function pageGarminPush(params: {
  page: number; pageSize: number; status?: string; type?: string; from?: string; to?: string
}) {
  return instance.get<unknown, ApiResponse<{ list: GarminPushMessage[]; total: number }>>('/admin/garmin/push-messages', { params })
}
export function getGarminPush(id: number) {
  return instance.get<unknown, ApiResponse<GarminPushDetail>>(`/admin/garmin/push-messages/${id}`)
}
