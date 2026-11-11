import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface GarminPushUser {
  garminUserId: string
  userId: number | null
  nickname: string | null
  email: string | null
}

export interface GarminPushMessage {
  id: number
  status: string
  attempts: number
  receivedAt: string
  availableAt: string
  summary: Record<string, number> | null
  payloadAvailable: boolean
  users: GarminPushUser[]
  payloadPreview: string | null
  lastError: string | null
  replayCount: number
}
export interface GarminPushDetail {
  message: GarminPushMessage
  payload: string | null
  payloadState: 'AVAILABLE' | 'CLEARED' | 'UNREADABLE'
}
export function pageGarminPush(params: {
  page: number; pageSize: number; status?: string; userId?: number; type?: string; from?: string; to?: string
}) {
  return instance.get<unknown, ApiResponse<{ list: GarminPushMessage[]; total: number }>>('/admin/garmin/push-messages', { params })
}
export function getGarminPush(id: number) {
  return instance.get<unknown, ApiResponse<GarminPushDetail>>(`/admin/garmin/push-messages/${id}`)
}

export function replayGarminPush(id: number, reason: string) {
  return instance.post<unknown, ApiResponse<boolean>>(`/admin/garmin/push-messages/${id}/replay`, { reason })
}
